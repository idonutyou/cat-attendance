$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$signDir = Join-Path $repoRoot ".cat-signing"
$keystorePath = Join-Path $signDir "cat-widget-release.jks"
$base64Path = Join-Path $signDir "CAT_WIDGET_KEYSTORE_BASE64.txt"
$alias = "cat-widget"

Write-Host ""
Write-Host "CAT 위젯 고정 서명키 설정" -ForegroundColor Cyan
Write-Host ""

$keytool = Get-Command keytool -ErrorAction SilentlyContinue
if (-not $keytool) {
    throw "keytool을 찾을 수 없습니다. JDK 17 이상을 설치한 뒤 다시 실행하세요."
}

New-Item -ItemType Directory -Path $signDir -Force | Out-Null

function Read-PlainPassword([string]$prompt) {
    $secure = Read-Host $prompt -AsSecureString
    $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    try {
        return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
    }
    finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
    }
}

$password = $null

if (Test-Path $keystorePath) {
    Write-Host "기존 서명키를 그대로 사용합니다:" -ForegroundColor Green
    Write-Host $keystorePath
    Write-Host "새 키로 덮어쓰지 않습니다."
    Write-Host ""

    $password = Read-PlainPassword "기존 서명키 비밀번호 입력"

    if ([string]::IsNullOrWhiteSpace($password)) {
        throw "비밀번호가 비어 있습니다."
    }

    # Windows PowerShell 5.1은 keytool.exe가 stderr로 경고를 출력하면
    # $ErrorActionPreference = "Stop" 상태에서 NativeCommandError로 중단될 수 있습니다.
    # 검증 구간에서만 native stderr를 조용히 처리하고 실제 종료코드로 성공 여부를 판단합니다.
    $savedErrorActionPreference = $ErrorActionPreference
    try {
        $ErrorActionPreference = "Continue"

        & $keytool.Source `
            -list `
            -keystore $keystorePath `
            -storepass $password `
            -alias $alias 2>$null | Out-Null

        $keytoolExitCode = $LASTEXITCODE
    }
    finally {
        $ErrorActionPreference = $savedErrorActionPreference
    }

    if ($keytoolExitCode -ne 0) {
        throw "기존 서명키 비밀번호가 맞지 않거나 cat-widget alias를 확인할 수 없습니다."
    }

    Write-Host "기존 서명키 확인 완료." -ForegroundColor Green
}
else {
    Write-Host "기존 서명키가 없어 새 고정 서명키를 생성합니다." -ForegroundColor Yellow
    Write-Host ""

    $password = Read-PlainPassword "서명키 비밀번호 입력 (8자 이상, 반드시 보관)"

    if ([string]::IsNullOrWhiteSpace($password) -or $password.Length -lt 8) {
        throw "비밀번호는 8자 이상으로 설정하세요."
    }

    $confirmPlain = Read-PlainPassword "같은 비밀번호 다시 입력"

    if ($password -ne $confirmPlain) {
        throw "비밀번호가 일치하지 않습니다."
    }

    $savedErrorActionPreference = $ErrorActionPreference
    try {
        $ErrorActionPreference = "Continue"

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

        $keytoolExitCode = $LASTEXITCODE
    }
    finally {
        $ErrorActionPreference = $savedErrorActionPreference
    }

    if ($keytoolExitCode -ne 0) {
        throw "서명키 생성에 실패했습니다."
    }

    $confirmPlain = $null
    Write-Host "새 서명키 생성 완료." -ForegroundColor Green
}

$bytes = [IO.File]::ReadAllBytes($keystorePath)
$base64 = [Convert]::ToBase64String($bytes)
[IO.File]::WriteAllText($base64Path, $base64, [Text.Encoding]::ASCII)

Write-Host ""
Write-Host "GitHub Secret용 BASE64 파일 준비 완료:" -ForegroundColor Green
Write-Host $base64Path
Write-Host ""

$gh = Get-Command gh -ErrorAction SilentlyContinue
$githubSecretsDone = $false

if ($gh) {
    & $gh.Source auth status *> $null
    if ($LASTEXITCODE -eq 0) {
        Push-Location $repoRoot
        try {
            $base64 | & $gh.Source secret set CAT_WIDGET_KEYSTORE_BASE64
            if ($LASTEXITCODE -ne 0) {
                throw "CAT_WIDGET_KEYSTORE_BASE64 등록 실패"
            }

            $password | & $gh.Source secret set CAT_WIDGET_KEYSTORE_PASSWORD
            if ($LASTEXITCODE -ne 0) {
                throw "CAT_WIDGET_KEYSTORE_PASSWORD 등록 실패"
            }

            $githubSecretsDone = $true
        }
        finally {
            Pop-Location
        }
    }
}

if ($githubSecretsDone) {
    Write-Host "GitHub Actions Secrets 2개도 자동 등록했습니다." -ForegroundColor Green
    Write-Host ""
    Write-Host "이제 GitHub Actions에서 실패한 작업을 Re-run jobs 하면 됩니다." -ForegroundColor Cyan
}
else {
    Write-Host "GitHub CLI 자동 등록을 사용할 수 없습니다." -ForegroundColor Yellow
    Write-Host "GitHub 저장소 > Settings > Secrets and variables > Actions 에 아래 2개를 등록하세요:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1) CAT_WIDGET_KEYSTORE_BASE64"
    Write-Host "   값: $base64Path 파일의 전체 내용"
    Write-Host ""
    Write-Host "2) CAT_WIDGET_KEYSTORE_PASSWORD"
    Write-Host "   값: 방금 입력한 기존 서명키 비밀번호"
}

Write-Host ""
Write-Host "중요: .cat-signing 폴더와 비밀번호는 계속 보관하세요." -ForegroundColor Yellow
Write-Host "이 고정 키를 계속 써야 기존 CAT 위젯 APK 위에 업데이트 설치할 수 있습니다." -ForegroundColor Yellow

$password = $null
$base64 = $null
