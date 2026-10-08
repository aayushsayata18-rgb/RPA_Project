const Patient = require('../models/Patient');

class PatientMatchingService {
  /**
   * Search and score potential matches in Patient Master
   * @param {Object} patientData - Sanitized patient input
   * @returns {Object} { matchStatus, matches, bestMatch }
   */
  static async findMatches(patientData) {
    const { firstName, lastName, dateOfBirth, gender, mobile, email, identityDocuments } = patientData;

    // Collect query candidates using OR conditions for high recall
    const orConditions = [];

    if (mobile) {
      orConditions.push({ mobile });
    }

    if (email) {
      orConditions.push({ email: email.toLowerCase() });
    }

    if (Array.isArray(identityDocuments) && identityDocuments.length > 0) {
      const refs = identityDocuments.map((d) => d.reference).filter(Boolean);
      if (refs.length > 0) {
        orConditions.push({ 'identityDocuments.reference': { $in: refs } });
      }
    }

    if (firstName && lastName) {
      const nameRegex = new RegExp(`^${firstName}.*${lastName}$`, 'i');
      orConditions.push({
        firstName: { $regex: new RegExp(`^${firstName}$`, 'i') },
        lastName: { $regex: new RegExp(`^${lastName}$`, 'i') }
      });
    }

    if (orConditions.length === 0) {
      return {
        matchStatus: 'NO_MATCH',
        matches: [],
        bestMatch: null
      };
    }

    const candidates = await Patient.find({
      status: { $ne: 'MERGED' },
      $or: orConditions
    }).limit(20).lean();

    if (candidates.length === 0) {
      return {
        matchStatus: 'NO_MATCH',
        matches: [],
        bestMatch: null
      };
    }

    // Score each candidate
    const scoredMatches = candidates.map((candidate) => {
      let score = 0;
      const reasons = [];

      // 1. Mobile Match (40 pts)
      if (mobile && candidate.mobile === mobile) {
        score += 40;
        reasons.push('Mobile number exact match');
      }

      // 2. Govt ID Reference Match (40 pts)
      if (Array.isArray(identityDocuments) && Array.isArray(candidate.identityDocuments)) {
        const inputRefs = identityDocuments.map((d) => d.reference).filter(Boolean);
        const candRefs = candidate.identityDocuments.map((d) => d.reference).filter(Boolean);
        const hasIdMatch = inputRefs.some((ref) => candRefs.includes(ref));
        if (hasIdMatch) {
          score += 40;
          reasons.push('Government identity document reference match');
        }
      }

      // 3. Date of Birth Match (25 pts)
      if (dateOfBirth && candidate.dateOfBirth) {
        const inputDob = new Date(dateOfBirth).toISOString().slice(0, 10);
        const candDob = new Date(candidate.dateOfBirth).toISOString().slice(0, 10);
        if (inputDob === candDob) {
          score += 25;
          reasons.push('Date of birth exact match');
        }
      }

      // 4. Name Match (25 pts)
      if (firstName && lastName && candidate.firstName && candidate.lastName) {
        const fMatch = candidate.firstName.trim().toLowerCase() === firstName.trim().toLowerCase();
        const lMatch = candidate.lastName.trim().toLowerCase() === lastName.trim().toLowerCase();
        if (fMatch && lMatch) {
          score += 25;
          reasons.push('Full name exact match');
        } else if (fMatch || lMatch) {
          score += 10;
          reasons.push('Partial name match');
        }
      }

      // 5. Gender Match (10 pts)
      if (gender && candidate.gender && gender === candidate.gender) {
        score += 10;
        reasons.push('Gender match');
      }

      // 6. Email Match (20 pts)
      if (email && candidate.email && email.toLowerCase() === candidate.email.toLowerCase()) {
        score += 20;
        reasons.push('Email address match');
      }

      return {
        patientId: candidate.patientId,
        _id: candidate._id,
        fullName: candidate.fullName || `${candidate.firstName} ${candidate.lastName}`,
        mobile: candidate.mobile,
        email: candidate.email,
        dateOfBirth: candidate.dateOfBirth,
        gender: candidate.gender,
        status: candidate.status,
        matchScore: Math.min(score, 100),
        matchReasons: reasons
      };
    });

    // Sort by match score descending
    scoredMatches.sort((a, b) => b.matchScore - a.matchScore);

    const bestMatch = scoredMatches[0];

    // Determine Classification
    let matchStatus = 'NO_MATCH';

    if (bestMatch.matchScore >= 85) {
      // If there are multiple high matches with different IDs, route to POSSIBLE_MATCH for human review
      const highMatches = scoredMatches.filter((m) => m.matchScore >= 80);
      if (highMatches.length > 1) {
        matchStatus = 'POSSIBLE_MATCH';
      } else {
        matchStatus = 'HIGH_CONFIDENCE_MATCH';
      }
    } else if (bestMatch.matchScore >= 45) {
      matchStatus = 'POSSIBLE_MATCH';
    } else {
      matchStatus = 'NO_MATCH';
    }

    return {
      matchStatus,
      matches: scoredMatches,
      bestMatch: matchStatus === 'HIGH_CONFIDENCE_MATCH' ? bestMatch : null
    };
  }
}

module.exports = PatientMatchingService;
