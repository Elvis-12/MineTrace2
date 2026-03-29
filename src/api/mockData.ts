// Mock Data for MineTrace

export const mockUsers = [
  { id: '1', fullName: 'Admin User', email: 'admin@eamitraco.com', role: 'ADMIN', organizationName: 'EAMITRACO HQ', status: 'ACTIVE', createdAt: '2025-01-15T10:00:00Z' },
  { id: '2', fullName: 'John Miner', email: 'john@rutongomines.com', role: 'MINE_OFFICER', organizationName: 'Rutongo Mines Ltd', status: 'ACTIVE', createdAt: '2025-02-01T09:30:00Z' },
  { id: '3', fullName: 'Sarah Supply', email: 'sarah@logistics.com', role: 'SUPPLY_OFFICER', organizationName: 'Kigali Logistics', status: 'ACTIVE', createdAt: '2025-02-10T14:15:00Z' },
  { id: '4', fullName: 'Inspector Gadget', email: 'inspector@gov.rw', role: 'INSPECTOR', organizationName: 'RMB', status: 'ACTIVE', createdAt: '2025-03-05T11:20:00Z' },
  { id: '5', fullName: 'Inactive User', email: 'old@eamitraco.com', role: 'MINE_OFFICER', organizationName: 'Closed Mine', status: 'INACTIVE', createdAt: '2024-11-20T08:00:00Z' },
];

export const mockOrganizations = [
  { id: 'org1', name: 'EAMITRACO HQ', address: 'Kigali, Rwanda', phone: '+250 788 123 456', email: 'info@eamitraco.com', usersCount: 15, createdAt: '2024-01-01T00:00:00Z' },
  { id: 'org2', name: 'Rutongo Mines Ltd', address: 'Northern Province', phone: '+250 788 987 654', email: 'contact@rutongo.com', usersCount: 42, createdAt: '2024-02-15T00:00:00Z' },
  { id: 'org3', name: 'Kigali Logistics', address: 'Kigali Industrial Zone', phone: '+250 788 555 444', email: 'dispatch@kigalilogistics.com', usersCount: 8, createdAt: '2024-06-10T00:00:00Z' },
];

export const mockMines = [
  { id: 'm1', name: 'Rutongo Main Shaft', location: 'Rutongo', province: 'Northern', district: 'Rulindo', licenseNumber: 'LIC-2024-001', organizationId: 'org2', organizationName: 'Rutongo Mines Ltd', active: true, createdAt: '2024-03-01T10:00:00Z' },
  { id: 'm2', name: 'Gatumba Concession', location: 'Gatumba', province: 'Western', district: 'Ngororero', licenseNumber: 'LIC-2024-088', organizationId: 'org1', organizationName: 'EAMITRACO HQ', active: true, createdAt: '2024-04-12T09:00:00Z' },
  { id: 'm3', name: 'Old Shaft 4', location: 'Muhanga', province: 'Southern', district: 'Muhanga', licenseNumber: 'LIC-2021-042', organizationId: 'org1', organizationName: 'EAMITRACO HQ', active: false, createdAt: '2021-08-20T14:00:00Z' },
];

export const mockBatches = [
  { id: 'b1', batchCode: 'MT-2026-001', mineralType: 'Cassiterite', initialWeight: 1250.5, status: 'IN_TRANSIT', riskLevel: 'LOW', mineId: 'm1', mineName: 'Rutongo Main Shaft', extractionDate: '2026-03-25T08:00:00Z', createdBy: 'John Miner', createdAt: '2026-03-26T10:15:00Z', anomalyScore: 0, flags: { weight: false, route: false, duplicate: false, license: false, handover: false }, overrideNote: null },
  { id: 'b2', batchCode: 'MT-2026-002', mineralType: 'Coltan', initialWeight: 840.0, status: 'REGISTERED', riskLevel: 'UNKNOWN', mineId: 'm2', mineName: 'Gatumba Concession', extractionDate: '2026-03-27T09:30:00Z', createdBy: 'Admin User', createdAt: '2026-03-28T11:00:00Z', anomalyScore: 0, flags: { weight: false, route: false, duplicate: false, license: false, handover: false }, overrideNote: null },
  { id: 'b3', batchCode: 'MT-2026-003', mineralType: 'Wolframite', initialWeight: 2100.0, status: 'FLAGGED', riskLevel: 'HIGH', mineId: 'm1', mineName: 'Rutongo Main Shaft', extractionDate: '2026-03-20T07:00:00Z', createdBy: 'John Miner', createdAt: '2026-03-21T14:20:00Z', anomalyScore: 4.2, flags: { weight: true, route: true, duplicate: false, license: false, handover: true }, overrideNote: null },
  { id: 'b4', batchCode: 'MT-2026-004', mineralType: 'Gold', initialWeight: 15.2, status: 'SOLD', riskLevel: 'LOW', mineId: 'm2', mineName: 'Gatumba Concession', extractionDate: '2026-03-10T08:00:00Z', createdBy: 'Admin User', createdAt: '2026-03-11T09:00:00Z', anomalyScore: 0.5, flags: { weight: false, route: false, duplicate: false, license: false, handover: false }, overrideNote: null },
  { id: 'b5', batchCode: 'MT-2026-005', mineralType: 'Cassiterite', initialWeight: 950.0, status: 'IN_STORAGE', riskLevel: 'MEDIUM', mineId: 'm1', mineName: 'Rutongo Main Shaft', extractionDate: '2026-03-22T10:00:00Z', createdBy: 'John Miner', createdAt: '2026-03-23T11:30:00Z', anomalyScore: 2.1, flags: { weight: true, route: false, duplicate: false, license: false, handover: false }, overrideNote: 'Weight discrepancy explained by moisture loss.' },
];

export const mockMovements = [
  { id: 'mov1', batchId: 'b1', batchCode: 'MT-2026-001', eventType: 'DISPATCH', fromLocation: 'Rutongo Mine', toLocation: 'Kigali Processing Center', weight: 1250.5, vehicle: 'RAB 123 C', recordedBy: 'Sarah Supply', timestamp: '2026-03-27T08:30:00Z' },
  { id: 'mov2', batchId: 'b3', batchCode: 'MT-2026-003', eventType: 'DISPATCH', fromLocation: 'Rutongo Mine', toLocation: 'Unknown Warehouse', weight: 2000.0, vehicle: 'RAC 456 D', recordedBy: 'John Miner', timestamp: '2026-03-22T09:00:00Z' },
  { id: 'mov3', batchId: 'b4', batchCode: 'MT-2026-004', eventType: 'SALE', fromLocation: 'Kigali HQ', toLocation: 'Export Partner', weight: 15.2, vehicle: 'Air Freight', recordedBy: 'Admin User', timestamp: '2026-03-15T14:00:00Z' },
  { id: 'mov4', batchId: 'b5', batchCode: 'MT-2026-005', eventType: 'STORAGE', fromLocation: 'Rutongo Mine', toLocation: 'Kigali Warehouse A', weight: 945.0, vehicle: 'RAB 789 E', recordedBy: 'Sarah Supply', timestamp: '2026-03-24T16:45:00Z' },
];

export const mockVerifications = [
  { id: 'v1', batchId: 'b4', checkpoint: 'Kigali Airport', passed: true, remarks: 'All seals intact.', verifiedBy: 'Inspector Gadget', timestamp: '2026-03-14T10:00:00Z' },
  { id: 'v2', batchId: 'b3', checkpoint: 'Highway Checkpoint 1', passed: false, remarks: 'Weight does not match manifest.', verifiedBy: 'Inspector Gadget', timestamp: '2026-03-23T11:15:00Z' },
];

export const mockAuditLogs = [
  { id: 'al1', action: 'USER_LOGIN', entityType: 'User', entityId: '1', performedBy: 'Admin User', ipAddress: '192.168.1.100', timestamp: '2026-03-28T08:00:00Z' },
  { id: 'al2', action: 'BATCH_CREATED', entityType: 'MineralBatch', entityId: 'b2', performedBy: 'Admin User', ipAddress: '192.168.1.100', timestamp: '2026-03-28T11:00:00Z' },
  { id: 'al3', action: 'RISK_OVERRIDE', entityType: 'MineralBatch', entityId: 'b5', performedBy: 'Admin User', ipAddress: '192.168.1.100', timestamp: '2026-03-25T15:30:00Z' },
];

export const mockNotifications = [
  { id: 'n1', type: 'HIGH_RISK_ALERT', title: 'High Risk Batch Detected', message: 'Batch MT-2026-003 has been flagged for multiple anomalies.', relatedEntityType: 'MineralBatch', relatedEntityId: 'b3', read: false, timestamp: '2026-03-28T12:00:00Z' },
  { id: 'n2', type: 'BATCH_DISPATCHED', title: 'Batch Dispatched', message: 'Batch MT-2026-001 has left Rutongo Mine.', relatedEntityType: 'MineralBatch', relatedEntityId: 'b1', read: true, timestamp: '2026-03-27T08:35:00Z' },
  { id: 'n3', type: 'VERIFICATION_FAILED', title: 'Verification Failed', message: 'Batch MT-2026-003 failed verification at Highway Checkpoint 1.', relatedEntityType: 'MineralBatch', relatedEntityId: 'b3', read: false, timestamp: '2026-03-23T11:20:00Z' },
];
