# Implementation Plan: Handover Flow from Upaya Hukum

## Requirements Restatement

The user wants to change the workflow for handing over documents to Panmud Hukum:

**Current behavior:**
- Documents from Gugatan/Permohonan can be inserted into Upaya Hukum (Banding)
- Handover to Panmud Hukum happens from Gugatan/Permohonan lists
- Documents remain visible in Gugatan/Permohonan even after being added to Upaya Hukum

**New behavior:**
- Documents already in Upaya Hukum (Banding or Kasasi) should **NOT** appear in Gugatan/Permohonan lists
- Handover to Panmud Hukum should happen from **Banding/Kasasi lists**, NOT from Gugatan/Permohonan

## Implementation Phases

### Phase 1: Backend - Filter Lawsuits with Existing Upaya Hukum

Modify the `lawsuits.repository.ts` to exclude lawsuits that have an existing `upayaHukum` relation.

**Files to modify:**
- [lawsuits.repository.ts](src/api/v1/lawsuits/repositories/lawsuits.repository.ts)

**Changes:**
1. Add a `IsNull` condition for `upayaHukum` relation in the `findByPagination` query
2. This will automatically hide lawsuits that have been inserted into Banding/Kasasi from the Gugatan/Permohonan lists

```typescript
// Add to where clause in findByPagination:
where = { ...where, upayaHukum: IsNull() }
```

### Phase 2: Backend - Add Handover to Hukum in Upaya Hukum Service

Add new methods in the Upaya Hukum service to handle bulk handover to Panmud Hukum.

**Files to modify:**
- [upaya-hukum.service.ts](src/api/v1/upaya-hukum/services/upaya-hukum.service.ts)
- [upaya-hukum.controller.ts](src/api/v1/upaya-hukum/controllers/upaya-hukum.controller.ts)
- [upaya-hukum.dto.ts](src/api/v1/upaya-hukum/dtos/upaya-hukum.dto.ts)

**New DTOs:**
```typescript
export class BulkHandoverToHukumDto {
  @ValidateNested({ each: true })
  @Type(() => HandoverToHukumItemDto)
  items: HandoverToHukumItemDto[]
}

export class HandoverToHukumItemDto {
  @IsUUID()
  upayaHukumId: string
}
```

**New Service Methods:**
1. `handoverToHukum(upayaHukumId: string)` - Single handover
2. `bulkHandoverToHukum(dto: BulkHandoverToHukumDto)` - Bulk handover
3. `receiveByHukum(upayaHukumId: string, userId: string)` - Single receive
4. `bulkReceiveByHukum(dto: BulkReceiveByHukumDto, userId: string)` - Bulk receive

**Logic:**
- When handover is triggered, update the related `lawsuit.status` to `SUBMITTED_TO_HUKUM`
- Set `lawsuit.submittedToHukumAt` timestamp
- When receive is triggered, update `lawsuit.status` to `RECEIVED_BY_HUKUM`
- Set `lawsuit.receivedByHukumAt` and `lawsuit.panmudHukum` user

### Phase 3: Backend - Add API Endpoints

Add new endpoints in the Upaya Hukum controller.

**Files to modify:**
- [upaya-hukum.controller.ts](src/api/v1/upaya-hukum/controllers/upaya-hukum.controller.ts)

**New Endpoints:**
```
POST /api/v1/upaya-hukum/handover-to-hukum     - Bulk handover to Hukum
POST /api/v1/upaya-hukum/receive-by-hukum      - Bulk receive by Hukum
```

### Phase 4: Frontend - Remove Handover Action from Gugatan/Permohonan

Remove the "Serahkan Berkas Ke Hukum" action from Gugatan and Permohonan lists.

**Files to modify:**
- [LawsuitList.tsx](../e-litera-fe/src/views/lawsuits/LawsuitList.tsx) - Remove `PiArrowRight` action for handover to Hukum
- [ApplicationList.tsx](../e-litera-fe/src/views/applications/ApplicationList.tsx) - Remove `PiArrowRight` action for handover to Hukum

**Changes:**
1. Remove the bulk action with `PiArrowRight` icon and tooltip "Serahkan Berkas" (for handover to Hukum)
2. Keep the other actions: Download Berita Acara, Terima Berkas, Masukan ke Upaya Hukum

### Phase 5: Frontend - Add Handover Action to Banding/Kasasi

Add the "Serahkan Berkas Ke Hukum" and "Terima Berkas" actions to Banding and Kasasi lists.

**Files to modify:**
- [BandingList.tsx](../e-litera-fe/src/views/upaya-hukum/banding/BandingList.tsx)
- [KasasiList.tsx](../e-litera-fe/src/views/upaya-hukum/kasasi/KasasiList.tsx)

**New bulk actions:**
1. `PiArrowRight` - "Serahkan Berkas Ke Hukum" (for PANMUD_GUGATAN, PANMUD_PERMOHONAN)
2. `PiCheckCircle` - "Terima Berkas" (for PANMUD_HUKUM)

### Phase 6: Frontend - Add API and Mutation Hooks

Create API functions and mutation hooks for the new Upaya Hukum handover operations.

**Files to create/modify:**
- [UpayaHukumService.ts](../e-litera-fe/src/services/UpayaHukumService.ts) - Add API functions
- [useUpayaHukum.tsx](../e-litera-fe/src/hooks/upaya-hukum/useUpayaHukum.tsx) - Add mutation hooks
- [upaya-hukum.ts](../e-litera-fe/src/@types/upaya-hukum.ts) - Add type definitions

**New API functions:**
```typescript
apiBulkHandoverUpayaHukumToHukum(data: BulkHandoverToHukumRequest)
apiBulkReceiveUpayaHukumByHukum(data: BulkReceiveByHukumRequest)
```

**New mutation hooks:**
```typescript
useBulkHandoverUpayaHukumToHukum()
useBulkReceiveUpayaHukumByHukum()
```

## Dependencies

- Backend: TypeORM `IsNull` operator for filtering
- Frontend: React Query for mutations, existing store patterns

## Risks

| Risk | Level | Mitigation |
|------|-------|------------|
| Existing data inconsistency | MEDIUM | Documents already in Upaya Hukum but still visible in Gugatan/Permohonan will disappear immediately after deployment |
| Status flow change | LOW | The lawsuit status flow remains the same (SUBMITTED_TO_HUKUM → RECEIVED_BY_HUKUM), just triggered from different UI |
| UI confusion for users | LOW | Users accustomed to handover from Gugatan may need training |

## Estimated Complexity: MEDIUM

- Backend: ~3-4 hours (filter + new endpoints + service methods)
- Frontend: ~2-3 hours (remove/add actions + API hooks)
- Testing: ~2 hours (verify workflow)

**Total: 7-9 hours**

---

**WAITING FOR CONFIRMATION**: Proceed with this plan? (yes/no/modify)