// ==================================================================================
// MASTER DATA ROUTES WITH SYNC
// ==================================================================================

// Update simple master data (type, tag) with sync
app.put('/make-server-f3064b20/master/:type/:id/sync', updateSimpleMasterDataWithSync)

// Update extended master data (actor, actress, director, series, studio, label, group) with sync
app.put('/make-server-f3064b20/master/:type/:id/extended/sync', updateExtendedMasterDataWithSync)