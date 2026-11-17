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
      const areaOccupancy = await repository.getAreaOccupancy(locationId);
      const mappedCandidates = candidates.map((candidate) => {
        let outcome;
        if (qrVersion !== undefined && candidate.qr_version !== qrVersion) {
          outcome = 'INVALID_QR';
        } else if (candidate.is_blacklisted) {
          outcome = 'BLOCKED_BLACKLIST';
        } else if (candidate.status !== 'ACTIVE' || candidate.access_expired) {
          outcome = 'NOT_ACTIVE';
        } else if (candidate.event_expired && !candidate.future_checkin_access) {
          outcome = 'EVENT_ACCESS_EXPIRED';
        } else if (candidate.open_visit_id !== null) {
          outcome = 'ALREADY_INSIDE';
        } else if (candidate.location_warning) {
          outcome = 'LOCATION_WARNING';
        } else {
          outcome = 'ELIGIBLE';
        }

        return {
          personId: candidate.person_id,
          categoryId: candidate.registration_category_id,
          registrationCategory: candidate.registration_category,
          userId: candidate.user_id ?? candidate.identity_id,
          identityId: candidate.identity_id,
          personCode: candidate.person_code,
          name: `${candidate.first_name} ${candidate.last_name}`.trim(),
          category: candidate.category,
          status: candidate.status,
          createdAt: candidate.created_at,
          expiresOn: candidate.expires_on,
          hasPhoto: candidate.has_photo,
          photoKey: candidate.photo_key,
          mobileMasked: candidate.mobile ? maskMobile(candidate.mobile) : null,
          accompanyingCount: candidate.accompanying_count,
          accompanying: candidate.accompanying,
          assignedAreaIds: candidate.assigned_area_ids ?? [],
          openVisitId: candidate.open_visit_id,
          insideSince: candidate.inside_since,
          locationWarning: candidate.location_warning,
          eventWarning: Boolean(candidate.event_expired && candidate.future_checkin_access
            && candidate.status === 'ACTIVE' && !candidate.is_blacklisted && !candidate.access_expired),
          outcome,
        };
      });
      const people = new Map();
      const categoriesByIdentity = new Map();
      for (const item of mappedCandidates) {
        const key = item.identityId ?? `person:${item.personId}`;
        if (item.status === 'ACTIVE' && item.categoryId != null && item.registrationCategory) {
          const categories = categoriesByIdentity.get(key) ?? [];
          if (!categories.some((category) => category.categoryId === Number(item.categoryId))) {
            categories.push({
              categoryId: Number(item.categoryId),
              personId: item.personId,
              name: item.registrationCategory,
              status: item.status,
              createdAt: item.createdAt,
              expiresOn: item.expiresOn,
              outcome: item.outcome,
              eventWarning: item.eventWarning,
              locationWarning: item.locationWarning,
              assignedAreaIds: item.assignedAreaIds,
              openVisitId: item.openVisitId,
              insideSince: item.insideSince,
              accompanyingCount: item.accompanyingCount,
            });
          }
          categoriesByIdentity.set(key, categories);
        }
        const current = people.get(key);
        if (!current || candidatePriority(item.outcome) < candidatePriority(current.outcome)) {
          people.set(key, item);
        }
      }
      const items = [...people.entries()].map(([key, person]) => {
        const selectedPerson = { ...person };
        delete selectedPerson.registrationCategory;
        return {
          ...selectedPerson,
          categories: categoriesByIdentity.get(key) ?? [],
        };
      });
      const outcomes = items.length ? items.map((item) => item.outcome) : ['NOT_FOUND'];

      await repository.recordLookup({
        actorUserId: actor.userId,
        actorRole: actor.role,
        resultCount: items.length,
        outcomes,
        personIds: items.map((item) => item.personId),
        blockedPersonIds: items.filter((item) => item.outcome === 'BLOCKED_BLACKLIST').map((item) => item.personId),
        mobileMasked: mobile ? maskMobile(mobile) : null,
        ipAddress: actor.ipAddress,
        device: actor.device,
      });

      return { items, outcome: items.length ? undefined : 'NOT_FOUND', areaOccupancy };
    },
  };
}

function candidatePriority(outcome) {
  return ({
    BLOCKED_BLACKLIST: 0,
    ALREADY_INSIDE: 1,
    ELIGIBLE: 2,
    LOCATION_WARNING: 3,
    EVENT_ACCESS_EXPIRED: 4,
    NOT_ACTIVE: 5,
    INVALID_QR: 6,
  })[outcome] ?? 7;
}

function maskMobile(mobile) {
  return `${'*'.repeat(Math.max(0, mobile.length - 4))}${mobile.slice(-4)}`;
}