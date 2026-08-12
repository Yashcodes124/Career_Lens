param(
  [string]$PostgresUser = "postgres",
  [int]$Port = 5432,
  [string]$PsqlPath = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
)

$scriptPath = Join-Path $PSScriptRoot "setup_db.sql"

if (-not (Test-Path -LiteralPath $PsqlPath)) {
  Write-Error "psql.exe was not found at '$PsqlPath'. Pass -PsqlPath with your local PostgreSQL path."
  exit 1
}

& $PsqlPath -U $PostgresUser -p $Port -f $scriptPath
Write-Host "Exit: $LASTEXITCODE"
