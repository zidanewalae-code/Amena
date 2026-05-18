# Script PowerShell d'aide pour démarrer MariaDB (XAMPP), backend et frontend en arrière-plan.

param()

# Chemins (adaptables)
$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
$MysqlExe = "C:\xampp\mysql\bin\mysqld.exe"

Write-Output "Démarrage des services AMENA depuis: $RepoRoot"

if (Test-Path $MysqlExe) {
    Write-Output "Lancement de MariaDB depuis XAMPP... ($MysqlExe)"
    Start-Process -FilePath $MysqlExe -ArgumentList "--defaults-file=`"C:\xampp\mysql\bin\my.ini`" --console" -WindowStyle Hidden -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 3
} else {
    Write-Output "mysqld.exe non trouvé à $MysqlExe — assurez-vous que MariaDB/XAMPP est installé et démarré manuellement si nécessaire."
}

# Démarrer le backend (installera les dépendances si besoin)
Write-Output "Démarrage du backend (dossier 'backend')"
Start-Job -ScriptBlock {
    cd "$PSScriptRoot\..\backend"
    if (Test-Path "package.json") { npm install }
    npm start
} | Out-Null

# Démarrer le frontend preview (Vite)
Write-Output "Démarrage du frontend preview (dossier 'web')"
Start-Job -ScriptBlock {
    cd "$PSScriptRoot\..\web"
    if (Test-Path "package.json") { npm install }
    npx vite preview --host 127.0.0.1 --port 5173
} | Out-Null

Write-Output "Scripts lancés en arrière-plan. Attendez quelques secondes et ouvrez: http://127.0.0.1:5173"
