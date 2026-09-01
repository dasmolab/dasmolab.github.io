# ===========================================================================
#  bump-version.ps1 — 캐시 버스팅 버전(?v=...) 일괄 갱신
#
#  app.js 또는 styles.css를 수정했다면 배포 전에 반드시 실행하세요.
#  루트 탭 8개 + 404.html + en/ 8개의 ?v= 값을 오늘 날짜(yyyyMMdd + 'a')로 바꿉니다.
#  같은 날 두 번째 배포라면 -Suffix b 처럼 접미사를 바꿔 주세요.
#
#  사용:  powershell -ExecutionPolicy Bypass -File scripts/bump-version.ps1
#         powershell -ExecutionPolicy Bypass -File scripts/bump-version.ps1 -Suffix b
# ===========================================================================
param([string]$Suffix = "a")

$root = Split-Path -Parent $PSScriptRoot
$version = (Get-Date -Format "yyyyMMdd") + $Suffix

$targets = @(Get-ChildItem -Path $root -Filter *.html -File) +
           @(Get-ChildItem -Path (Join-Path $root "en") -Filter *.html -File -ErrorAction SilentlyContinue)

$changed = 0
foreach ($f in $targets) {
    $text = Get-Content -Raw -Encoding UTF8 $f.FullName
    $new = $text -replace '\?v=\w+', "?v=$version"
    if ($new -ne $text) {
        [System.IO.File]::WriteAllText($f.FullName, $new, (New-Object System.Text.UTF8Encoding($false)))
        $changed++
        Write-Host " - $($f.FullName.Substring($root.Length + 1))"
    }
}
Write-Host "== ?v=$version 으로 $changed 개 파일 갱신 완료 =="
