-- ============================================================
-- Script: SeedDeploymentRules.sql
-- Desc:   Seed de DeploymentModes, RuleSets, DeployRules y
--         DeployBlockedPatterns para DeployManager.
--         Idempotente (usa MERGE / IF NOT EXISTS).
-- ============================================================

SET NOCOUNT ON;

DECLARE @FULL_INSTALL_ID     UNIQUEIDENTIFIER
DECLARE @PARTIAL_UPDATE_ID   UNIQUEIDENTIFIER
DECLARE @RS_FULL_ID          UNIQUEIDENTIFIER
DECLARE @RS_PARTIAL_ID       UNIQUEIDENTIFIER

BEGIN TRANSACTION;
BEGIN TRY

    -- ==========================================================
    -- 1. DeploymentModes
    -- ==========================================================

    -- FULL_INSTALL
    SELECT @FULL_INSTALL_ID = Id FROM DeploymentModes WHERE Code = N'FULL_INSTALL';
    IF @FULL_INSTALL_ID IS NULL
    BEGIN
        SET @FULL_INSTALL_ID = NEWID();
        INSERT INTO DeploymentModes (Id, Name, Code, IsActive, CreatedAt, UpdatedAt, IsDeleted)
        VALUES (@FULL_INSTALL_ID, N'Instalación completa', N'FULL_INSTALL', 1, GETUTCDATE(), NULL, 0);
    END

    -- PARTIAL_UPDATE
    SELECT @PARTIAL_UPDATE_ID = Id FROM DeploymentModes WHERE Code = N'PARTIAL_UPDATE';
    IF @PARTIAL_UPDATE_ID IS NULL
    BEGIN
        SET @PARTIAL_UPDATE_ID = NEWID();
        INSERT INTO DeploymentModes (Id, Name, Code, IsActive, CreatedAt, UpdatedAt, IsDeleted)
        VALUES (@PARTIAL_UPDATE_ID, N'Actualización parcial', N'PARTIAL_UPDATE', 1, GETUTCDATE(), NULL, 0);
    END

    -- ==========================================================
    -- 2. RuleSets
    -- ==========================================================

    -- FULL_INSTALL_ASPNET
    SELECT @RS_FULL_ID = Id FROM RuleSets WHERE Code = N'FULL_INSTALL_ASPNET';
    IF @RS_FULL_ID IS NULL
    BEGIN
        SET @RS_FULL_ID = NEWID();
        INSERT INTO RuleSets (Id, Code, Name, DeploymentModeId, IsDefault, IsActive, CreatedAt, UpdatedAt, IsDeleted)
        VALUES (@RS_FULL_ID, N'FULL_INSTALL_ASPNET', N'Instalación completa ASP.NET', @FULL_INSTALL_ID, 1, 1, GETUTCDATE(), NULL, 0);
    END

    -- PARTIAL_UPDATE_ASPNET_WEBFORMS
    SELECT @RS_PARTIAL_ID = Id FROM RuleSets WHERE Code = N'PARTIAL_UPDATE_ASPNET_WEBFORMS';
    IF @RS_PARTIAL_ID IS NULL
    BEGIN
        SET @RS_PARTIAL_ID = NEWID();
        INSERT INTO RuleSets (Id, Code, Name, DeploymentModeId, IsDefault, IsActive, CreatedAt, UpdatedAt, IsDeleted)
        VALUES (@RS_PARTIAL_ID, N'PARTIAL_UPDATE_ASPNET_WEBFORMS', N'Actualización parcial ASP.NET WebForms', @PARTIAL_UPDATE_ID, 1, 1, GETUTCDATE(), NULL, 0);
    END

    -- ==========================================================
    -- 3. Rules — FULL_INSTALL_ASPNET
    -- ==========================================================

    -- Eliminar reglas existentes de web.config / appsettings.json
    -- asociadas a PARTIAL_UPDATE_ASPNET_WEBFORMS (por si existían antes)
    UPDATE Rules
    SET IsDeleted = 1, UpdatedAt = GETUTCDATE()
    WHERE DeployRuleSetId = @RS_PARTIAL_ID
      AND (SourcePattern = N'web.config' OR SourcePattern = N'appsettings.json')
      AND IsDeleted = 0;

    -- Regla 1: copiar todo con backup
    IF NOT EXISTS (SELECT 1 FROM Rules WHERE DeployRuleSetId = @RS_FULL_ID AND SourcePattern = N'**/*' AND IsDeleted = 0)
        INSERT INTO Rules (Id, Name, SourcePattern, DestinationPath, Action, [Order], IsActive, DeployRuleSetId, CreatedAt, UpdatedAt, IsDeleted)
        VALUES (NEWID(), N'Todos los archivos (con backup)', N'**/*', N'/', N'backup_and_copy', 1, 1, @RS_FULL_ID, GETUTCDATE(), NULL, 0);

    -- Regla 2: omitir web.config
    IF NOT EXISTS (SELECT 1 FROM Rules WHERE DeployRuleSetId = @RS_FULL_ID AND SourcePattern = N'web.config' AND IsDeleted = 0)
        INSERT INTO Rules (Id, Name, SourcePattern, DestinationPath, Action, [Order], IsActive, DeployRuleSetId, CreatedAt, UpdatedAt, IsDeleted)
        VALUES (NEWID(), N'Omitir web.config', N'web.config', N'/', N'omit', 2, 1, @RS_FULL_ID, GETUTCDATE(), NULL, 0);

    -- Regla 3: omitir appsettings.json
    IF NOT EXISTS (SELECT 1 FROM Rules WHERE DeployRuleSetId = @RS_FULL_ID AND SourcePattern = N'appsettings.json' AND IsDeleted = 0)
        INSERT INTO Rules (Id, Name, SourcePattern, DestinationPath, Action, [Order], IsActive, DeployRuleSetId, CreatedAt, UpdatedAt, IsDeleted)
        VALUES (NEWID(), N'Omitir appsettings.json', N'appsettings.json', N'/', N'omit', 3, 1, @RS_FULL_ID, GETUTCDATE(), NULL, 0);

    -- ==========================================================
    -- 4. Rules — PARTIAL_UPDATE_ASPNET_WEBFORMS
    --    (sin reglas para web.config ni appsettings.json)
    -- ==========================================================

    -- Regla 1: bin/**/*.dll
    IF NOT EXISTS (SELECT 1 FROM Rules WHERE DeployRuleSetId = @RS_PARTIAL_ID AND SourcePattern = N'bin/**/*.dll' AND IsDeleted = 0)
        INSERT INTO Rules (Id, Name, SourcePattern, DestinationPath, Action, [Order], IsActive, DeployRuleSetId, CreatedAt, UpdatedAt, IsDeleted)
        VALUES (NEWID(), N'DLLs de bin', N'bin/**/*.dll', N'bin/', N'backup_and_copy', 1, 1, @RS_PARTIAL_ID, GETUTCDATE(), NULL, 0);

    -- Regla 2: VIEW/**/*.aspx
    IF NOT EXISTS (SELECT 1 FROM Rules WHERE DeployRuleSetId = @RS_PARTIAL_ID AND SourcePattern = N'VIEW/**/*.aspx' AND IsDeleted = 0)
        INSERT INTO Rules (Id, Name, SourcePattern, DestinationPath, Action, [Order], IsActive, DeployRuleSetId, CreatedAt, UpdatedAt, IsDeleted)
        VALUES (NEWID(), N'Formularios ASPX', N'VIEW/**/*.aspx', N'VIEW/', N'backup_and_copy', 2, 1, @RS_PARTIAL_ID, GETUTCDATE(), NULL, 0);

    -- Regla 3: VIEW/**/*.master
    IF NOT EXISTS (SELECT 1 FROM Rules WHERE DeployRuleSetId = @RS_PARTIAL_ID AND SourcePattern = N'VIEW/**/*.master' AND IsDeleted = 0)
        INSERT INTO Rules (Id, Name, SourcePattern, DestinationPath, Action, [Order], IsActive, DeployRuleSetId, CreatedAt, UpdatedAt, IsDeleted)
        VALUES (NEWID(), N'Master pages', N'VIEW/**/*.master', N'VIEW/', N'copy_if_not_exists', 3, 1, @RS_PARTIAL_ID, GETUTCDATE(), NULL, 0);

    -- Regla 4: obj/**/*
    IF NOT EXISTS (SELECT 1 FROM Rules WHERE DeployRuleSetId = @RS_PARTIAL_ID AND SourcePattern = N'obj/**/*' AND IsDeleted = 0)
        INSERT INTO Rules (Id, Name, SourcePattern, DestinationPath, Action, [Order], IsActive, DeployRuleSetId, CreatedAt, UpdatedAt, IsDeleted)
        VALUES (NEWID(), N'Omitir obj', N'obj/**/*', N'/', N'omit', 4, 1, @RS_PARTIAL_ID, GETUTCDATE(), NULL, 0);

    -- Regla 5: .git/**/*
    IF NOT EXISTS (SELECT 1 FROM Rules WHERE DeployRuleSetId = @RS_PARTIAL_ID AND SourcePattern = N'.git/**/*' AND IsDeleted = 0)
        INSERT INTO Rules (Id, Name, SourcePattern, DestinationPath, Action, [Order], IsActive, DeployRuleSetId, CreatedAt, UpdatedAt, IsDeleted)
        VALUES (NEWID(), N'Omitir .git', N'.git/**/*', N'/', N'omit', 5, 1, @RS_PARTIAL_ID, GETUTCDATE(), NULL, 0);

    -- Regla 6: .vs/**/*
    IF NOT EXISTS (SELECT 1 FROM Rules WHERE DeployRuleSetId = @RS_PARTIAL_ID AND SourcePattern = N'.vs/**/*' AND IsDeleted = 0)
        INSERT INTO Rules (Id, Name, SourcePattern, DestinationPath, Action, [Order], IsActive, DeployRuleSetId, CreatedAt, UpdatedAt, IsDeleted)
        VALUES (NEWID(), N'Omitir .vs', N'.vs/**/*', N'/', N'omit', 6, 1, @RS_PARTIAL_ID, GETUTCDATE(), NULL, 0);

    -- Regla 7: **/*.cs
    IF NOT EXISTS (SELECT 1 FROM Rules WHERE DeployRuleSetId = @RS_PARTIAL_ID AND SourcePattern = N'**/*.cs' AND IsDeleted = 0)
        INSERT INTO Rules (Id, Name, SourcePattern, DestinationPath, Action, [Order], IsActive, DeployRuleSetId, CreatedAt, UpdatedAt, IsDeleted)
        VALUES (NEWID(), N'Omitir código fuente .cs', N'**/*.cs', N'/', N'omit', 7, 1, @RS_PARTIAL_ID, GETUTCDATE(), NULL, 0);

    -- Regla 8: **/*.user
    IF NOT EXISTS (SELECT 1 FROM Rules WHERE DeployRuleSetId = @RS_PARTIAL_ID AND SourcePattern = N'**/*.user' AND IsDeleted = 0)
        INSERT INTO Rules (Id, Name, SourcePattern, DestinationPath, Action, [Order], IsActive, DeployRuleSetId, CreatedAt, UpdatedAt, IsDeleted)
        VALUES (NEWID(), N'Omitir archivos .user', N'**/*.user', N'/', N'omit', 8, 1, @RS_PARTIAL_ID, GETUTCDATE(), NULL, 0);

    -- Regla 9: **/*.suo
    IF NOT EXISTS (SELECT 1 FROM Rules WHERE DeployRuleSetId = @RS_PARTIAL_ID AND SourcePattern = N'**/*.suo' AND IsDeleted = 0)
        INSERT INTO Rules (Id, Name, SourcePattern, DestinationPath, Action, [Order], IsActive, DeployRuleSetId, CreatedAt, UpdatedAt, IsDeleted)
        VALUES (NEWID(), N'Omitir archivos .suo', N'**/*.suo', N'/', N'omit', 9, 1, @RS_PARTIAL_ID, GETUTCDATE(), NULL, 0);

    -- ==========================================================
    -- 5. DeployBlockedPatterns
    -- ==========================================================

    MERGE BlockedPatterns AS TARGET
    USING (VALUES
        (N'obj/**/*',     N'Carpeta temporal de compilación'),
        (N'.git/**/*',    N'Repositorio Git'),
        (N'.vs/**/*',     N'Configuración de Visual Studio'),
        (N'**/*.cs',      N'Código fuente C#'),
        (N'**/*.user',    N'Archivo de usuario VS'),
        (N'**/*.suo',     N'Opción de solución VS'),
        (N'**/*.pdb',     N'Archivos de depuración'),
        (N'packages/**/*',N'Paquetes NuGet'),
        (N'node_modules/**/*', N'Dependencias Node.js')
    ) AS SRC (Pattern, Description)
    ON TARGET.Pattern = SRC.Pattern AND TARGET.IsDeleted = 0
    WHEN NOT MATCHED BY TARGET THEN
        INSERT (Id, Pattern, Description, IsActive, CreatedAt, UpdatedAt, IsDeleted)
        VALUES (NEWID(), SRC.Pattern, SRC.Description, 1, GETUTCDATE(), NULL, 0);

    -- ==========================================================
    -- 6. Commit
    -- ==========================================================

    COMMIT TRANSACTION;

    -- ==========================================================
    -- 7. Resumen
    -- ==========================================================

    SELECT '=== DeploymentModes ===' AS [ ];
    SELECT Id, Name, Code, IsActive, CreatedAt FROM DeploymentModes WHERE IsDeleted = 0;

    SELECT '=== RuleSets ===' AS [ ];
    SELECT rs.Id, rs.Code, rs.Name, dm.Name AS DeploymentMode, rs.IsDefault, rs.IsActive
    FROM RuleSets rs
    INNER JOIN DeploymentModes dm ON dm.Id = rs.DeploymentModeId
    WHERE rs.IsDeleted = 0;

    SELECT '=== Reglas FULL_INSTALL_ASPNET ===' AS [ ];
    SELECT r.Name, r.SourcePattern, r.DestinationPath, r.Action, r.[Order]
    FROM Rules r
    WHERE r.DeployRuleSetId = @RS_FULL_ID AND r.IsDeleted = 0
    ORDER BY r.[Order];

    SELECT '=== Reglas PARTIAL_UPDATE_ASPNET_WEBFORMS ===' AS [ ];
    SELECT r.Name, r.SourcePattern, r.DestinationPath, r.Action, r.[Order]
    FROM Rules r
    WHERE r.DeployRuleSetId = @RS_PARTIAL_ID AND r.IsDeleted = 0
    ORDER BY r.[Order];

    SELECT '=== BlockedPatterns ===' AS [ ];
    SELECT Pattern, Description, IsActive FROM BlockedPatterns WHERE IsDeleted = 0;

    -- ==========================================================
    -- 8. Verificación: PARTIAL_UPDATE_ASPNET_WEBFORMS no debe
    --    tener reglas para web.config ni appsettings.json
    -- ==========================================================

    SELECT '=== VERIFICACIÓN (debe ser 0) ===' AS [ ];
    SELECT COUNT(*) AS ReglasConfigProhibidas
    FROM Rules
    WHERE DeployRuleSetId = @RS_PARTIAL_ID
      AND SourcePattern IN (N'web.config', N'appsettings.json')
      AND IsDeleted = 0;

END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO
