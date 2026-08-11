$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$signDir = Join-Path $repoRoot ".cat-signing"
$keystorePath = Join-Path $signDir "cat-widget-release.jks"
$base64Path = Join-Path $signDir "CAT_WIDGET_KEYSTORE_BASE64.txt"
$alias = "cat-widget"

Write-Host ""
Write-Host "CAT 위젯 고정 서명키 설정" -ForegroundColor Cyan
Write-Host "이 작업은 최초 1회만 실행하세요." -ForegroundColor Yellow
Write-Host ""

if (Test-Path $keystorePath) {
    Write-Host "기존 서명키가 이미 있습니다:" -ForegroundColor Yellow
    Write-Host $keystorePath
    Write-Host "업데이트 호환성을 위해 새 키로 덮어쓰지 않습니다."
    exit 1
}

$keytool = Get-Command keytool -ErrorAction SilentlyContinue
if (-not $keytool) {
    throw "keytool을 찾을 수 없습니다. JDK 17 이상을 설치한 뒤 다시 실행하세요."
}

New-Item -ItemType Directory -Path $signDir -Force | Out-Null

function Read-PlainPassword {
    $secure = Read-Host "서명키 비밀번호 입력 (기억하거나 안전하게 보관)" -AsSecureString
    $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    try {
        return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
    }
    finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
    }
}

$password = Read-PlainPassword
if ([string]::IsNullOrWhiteSpace($password) -or $password.Length -lt 8) {
    throw "비밀번호는 8자 이상으로 설정하세요."
}

$confirm = Read-Host "같은 비밀번호 다시 입력" -AsSecureString
$confirmPtr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($confirm)
try {
    $confirmPlain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($confirmPtr)
}
finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($confirmPtr)
}

if ($password -ne $confirmPlain) {
    throw "비밀번호가 일치하지 않습니다."
}

& $keytool.Source `
    -genkeypair `
    -v `
    -keystore $keystorePath `
    -storetype JKS `
    -storepass $password `
    -keypass $password `
    -alias $alias `
    -keyalg RSA `
    -keysize 2048 `
    -validity 25000 `
    -dname "CN=CAT Widget, OU=Personal, O=CAT, C=KR"

if ($LASTEXITCODE -ne 0) {
    throw "서명키 생성에 실패했습니다."
}

$bytes = [IO.File]::ReadAllBytes($keystorePath)
$base64 = [Convert]::ToBase64String($bytes)
[IO.File]::WriteAllText($base64Path, $base64, [Text.Encoding]::ASCII)

Write-Host ""
Write-Host "서명키 생성 완료:" -ForegroundColor Green
Write-Host $keystorePath
Write-Host ""
Write-Host "이 파일은 절대 삭제하지 말고 별도 안전한 곳에도 백업하세요." -ForegroundColor Yellow
Write-Host ""

$gh = Get-Command gh -ErrorAction SilentlyContinue
$githubSecretsDone = $false

if ($gh) {
    & $gh.Source auth status *> $null
    if ($LASTEXITCODE -eq 0) {
        Push-Location $repoRoot
        try {
            $base64 | & $gh.Source secret set CAT_WIDGET_KEYSTORE_BASE64
            if ($LASTEXITCODE -ne 0) { throw "CAT_WIDGET_KEYSTORE_BASE64 등록 실패" }

            $password | & $gh.Source secret set CAT_WIDGET_KEYSTORE_PASSWORD
            if ($LASTEXITCODE -ne 0) { throw "CAT_WIDGET_KEYSTORE_PASSWORD 등록 실패" }

            $githubSecretsDone = $true
        }
        finally {
            Pop-Location
        }
    }
}

if ($githubSecretsDone) {
    Write-Host "GitHub Actions Secrets 2개도 자동 등록했습니다." -ForegroundColor Green
}
else {
    Write-Host "GitHub 저장소 > Settings > Secrets and variables > Actions 에 아래 2개를 등록하세요:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1) CAT_WIDGET_KEYSTORE_BASE64"
    Write-Host "   값: $base64Path 파일의 전체 내용"
    Write-Host ""
    Write-Host "2) CAT_WIDGET_KEYSTORE_PASSWORD"
    Write-Host "   값: 방금 입력한 서명키 비밀번호"
    Write-Host ""
    Write-Host "GitHub CLI(gh)가 로그인되어 있으면 이 스크립트가 자동 등록할 수도 있습니다."
}

$password = $null
$confirmPlain = $null

Write-Host ""
Write-Host "중요: 앞으로 모든 CAT 위젯 APK는 이 동일한 서명키로 빌드해야 업데이트 설치가 가능합니다." -ForegroundColor Yellow
