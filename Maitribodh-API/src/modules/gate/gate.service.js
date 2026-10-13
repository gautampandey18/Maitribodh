import { ApiError } from '../../errors/ApiError.js';

export function createGateService({ repository, qrService }) {
  return {
    async lookup({ qrPayload, mobile, query, locationId, actor }) {
      if (!await repository.isActiveLocation(locationId)) {
        throw new ApiError(404, 'LOCATION_NOT_AVAILABLE', 'Active gate or location not found');
      }

      let personCode;
      let qrVersion;
      if (qrPayload) {
        const parsedQr = qrService.verifyQrPayload(qrPayload);
        if (!parsedQr) {
          await repository.recordLookup({
            actorUserId: actor.userId,
            actorRole: actor.role,
            resultCount: 0,
            outcomes: ['INVALID_QR'],
            mobileMasked: null,
            ipAddress: actor.ipAddress,
            device: actor.device,
          });
          throw new ApiError(400, 'INVALID_QR', 'QR code is invalid');
        }
        personCode = parsedQr.personCode;
        qrVersion = parsedQr.version;
      }

      const candidates = await repository.findCandidates({ personCode, mobile, locationId, ...(query ? { query } : {}) });
      const items = candidates.map((candidate) => {
        let outcome;
        if (qrVersion !== undefined && candidate.qr_version !== qrVersion) {
          outcome = 'INVALID_QR';
        } else if (candidate.is_blacklisted) {
          outcome = 'BLOCKED_BLACKLIST';
        } else if (candidate.status !== 'ACTIVE' || candidate.access_expired) {
          outcome = 'NOT_ACTIVE';
        } else if (candidate.open_visit_id !== null) {
          outcome = 'ALREADY_INSIDE';
        } else if (candidate.location_warning) {
          outcome = 'LOCATION_WARNING';
        } else {
          outcome = 'ELIGIBLE';
        }

        return {
          personId: candidate.person_id,
          personCode: candidate.person_code,
          name: `${candidate.first_name} ${candidate.last_name}`.trim(),
          category: candidate.category,
          status: candidate.status,
          hasPhoto: candidate.has_photo,
          photoKey: candidate.photo_key,
          mobileMasked: candidate.mobile ? maskMobile(candidate.mobile) : null,
          accompanyingCount: candidate.accompanying_count,
          accompanying: candidate.accompanying,
          assignedAreaIds: candidate.assigned_area_ids ?? [],
          openVisitId: candidate.open_visit_id,
          insideSince: candidate.inside_since,
          locationWarning: candidate.location_warning,
          outcome,
        };
      });
      const outcomes = items.length ? items.map((item) => item.outcome) : ['NOT_FOUND'];

      await repository.recordLookup({
        actorUserId: actor.userId,
        actorRole: actor.role,
        resultCount: items.length,
        outcomes,
        mobileMasked: mobile ? maskMobile(mobile) : null,
        ipAddress: actor.ipAddress,
        device: actor.device,
      });

      return { items, outcome: items.length ? undefined : 'NOT_FOUND' };
    },
  };
}

function maskMobile(mobile) {
  return `${'*'.repeat(Math.max(0, mobile.length - 4))}${mobile.slice(-4)}`;
}