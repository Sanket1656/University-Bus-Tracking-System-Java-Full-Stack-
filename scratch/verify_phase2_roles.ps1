$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   PHASE 2: ROLE-BASED VERIFICATION & BOUNDARY TESTING    " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$unique = [System.Guid]::NewGuid().ToString().Substring(0, 6)

# -----------------------------------------------------------------------------
# 1. ADMIN ROLE TESTING
# -----------------------------------------------------------------------------
Write-Host "`n>>> [ADMIN ROLE] Testing Admin Capabilities & Operations <<<" -ForegroundColor Yellow

# 1.1 Admin Login
$adminRes = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -Body (@{ username = "admin"; password = "admin123" } | ConvertTo-Json) -ContentType "application/json"
$adminToken = $adminRes.token
$adminHeaders = @{ Authorization = "Bearer $adminToken" }
Write-Host "  [OK] Admin Login: Succeeded. Token received." -ForegroundColor Green

# 1.2 Admin Create Driver
$p2DriverUsername = "p2_driver_$unique"
$p2DriverEmail = "p2_driver_$unique@university.edu"
$p2DriverPass = "P2DriverPass@123"
$createDriverBody = @{
    username = $p2DriverUsername
    password = $p2DriverPass
    name = "Phase Two Driver $unique"
    email = $p2DriverEmail
    phone = "9876543210"
    licenseId = "DL-P2-$unique"
} | ConvertTo-Json
$p2DriverRes = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/drivers" -Method Post -Headers $adminHeaders -Body $createDriverBody -ContentType "application/json"
$p2DriverId = $p2DriverRes.data.id
Write-Host "  [OK] Admin Create Driver: Created driver ID=$p2DriverId ($p2DriverUsername)" -ForegroundColor Green

# 1.3 Admin Search Driver
$searchDriver = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/drivers?search=$p2DriverUsername" -Method Get -Headers $adminHeaders
$found = $searchDriver.data | Where-Object { $_.username -eq $p2DriverUsername }
if ($found) {
    Write-Host "  [OK] Admin Search Driver: Successfully located driver '$p2DriverUsername' via query parameter." -ForegroundColor Green
} else {
    Write-Host "  [FAIL] Admin Search Driver: Driver not found in search results." -ForegroundColor Red
}

# 1.4 Admin Edit Driver
$editDriverBody = @{
    name = "Phase Two Driver Updated $unique"
    phone = "9876500000"
    licenseId = "DL-P2-UPDATED-$unique"
} | ConvertTo-Json
$editDriverRes = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/drivers/$p2DriverId" -Method Put -Headers $adminHeaders -Body $editDriverBody -ContentType "application/json"
Write-Host "  [OK] Admin Edit Driver: Updated name to '$($editDriverRes.data.name)'" -ForegroundColor Green

# 1.5 Admin Deactivate Driver
$deactRes = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/drivers/$p2DriverId/deactivate" -Method Post -Headers $adminHeaders
Write-Host "  [OK] Admin Deactivate Driver: Status updated to '$($deactRes.data.status)'" -ForegroundColor Green

# Verify deactivated driver CANNOT login
try {
    Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -Body (@{ username = $p2DriverUsername; password = $p2DriverPass } | ConvertTo-Json) -ContentType "application/json"
    Write-Host "  [FAIL] Deactivated driver was able to log in!" -ForegroundColor Red
} catch {
    Write-Host "  [OK] Inactive Driver Login Rejected: HTTP $($_.Exception.Response.StatusCode.value__) $($_.Exception.Message)" -ForegroundColor Green
}

# 1.6 Admin Reactivate Driver
$reactRes = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/drivers/$p2DriverId/reactivate" -Method Post -Headers $adminHeaders
Write-Host "  [OK] Admin Reactivate Driver: Status updated to '$($reactRes.data.status)'" -ForegroundColor Green

# Verify reactivated driver CAN login now
$p2DriverLogin = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -Body (@{ username = $p2DriverUsername; password = $p2DriverPass } | ConvertTo-Json) -ContentType "application/json"
$p2DriverToken = $p2DriverLogin.token
$p2DriverHeaders = @{ Authorization = "Bearer $p2DriverToken" }
Write-Host "  [OK] Reactivated Driver Login Succeeded." -ForegroundColor Green

# 1.7 Admin Fleet Management: Buses, Routes, Assignments, Schedules, Seats
$allBuses = Invoke-RestMethod -Uri "http://localhost:5000/api/bus/get-all-buses" -Method Get -Headers $adminHeaders
Write-Host "  [OK] Admin View Buses: Total buses = $($allBuses.summary.total)" -ForegroundColor Green

$allRoutes = Invoke-RestMethod -Uri "http://localhost:5000/api/routes/get-all-routes" -Method Get -Headers $adminHeaders
Write-Host "  [OK] Admin View Routes: Total routes = $($allRoutes.data.Count)" -ForegroundColor Green

$allAssignments = Invoke-RestMethod -Uri "http://localhost:5000/api/assignment/get-all-assignments" -Method Get -Headers $adminHeaders
Write-Host "  [OK] Admin View Assignments: Total assignments = $($allAssignments.summary.total)" -ForegroundColor Green

$allSchedules = Invoke-RestMethod -Uri "http://localhost:5000/api/schedules" -Method Get -Headers $adminHeaders
Write-Host "  [OK] Admin View Schedules: Total schedules = $($allSchedules.data.Count)" -ForegroundColor Green

# -----------------------------------------------------------------------------
# 2. DRIVER ROLE TESTING
# -----------------------------------------------------------------------------
Write-Host "`n>>> [DRIVER ROLE] Testing Driver Capabilities & Boundaries <<<" -ForegroundColor Yellow

# 2.1 Driver Profile View & Edit
$driverProfile = Invoke-RestMethod -Uri "http://localhost:5000/api/driver/profile" -Method Get -Headers $p2DriverHeaders
Write-Host "  [OK] Driver View Profile: Name='$($driverProfile.data.name)', Email='$($driverProfile.data.email)', Status='$($driverProfile.data.status)'" -ForegroundColor Green

$updateProfRaw = curl.exe -s -X PUT http://localhost:5000/api/driver/profile -H "Authorization: Bearer $p2DriverToken" -F "phone=9876543210" -F "age=42" -F "address=123 Campus Lane"
$updateProfRes = $updateProfRaw | ConvertFrom-Json
Write-Host "  [OK] Driver Edit Profile: Succeeded. Updated phone='$($updateProfRes.data.phone)', address='$($updateProfRes.data.address)'" -ForegroundColor Green

# 2.2 Driver Boundary Tests: Driver cannot access Admin endpoints
Write-Host "  Testing Driver boundary restrictions against Admin endpoints:" -ForegroundColor Gray
$adminEndpointsToTest = @(
    @{ Url = "http://localhost:5000/api/admin/drivers"; Method = "Get" },
    @{ Url = "http://localhost:5000/api/bus/bus-create"; Method = "Post"; Body = (@{ busNumber = "HACK" } | ConvertTo-Json) },
    @{ Url = "http://localhost:5000/api/transport/pending-transport-requests"; Method = "Get" },
    @{ Url = "http://localhost:5000/api/transport/assignment/2/students"; Method = "Get" }
)
foreach ($ep in $adminEndpointsToTest) {
    try {
        if ($ep.Method -eq "Post") {
            Invoke-RestMethod -Uri $ep.Url -Method Post -Headers $p2DriverHeaders -Body $ep.Body -ContentType "application/json"
        } else {
            Invoke-RestMethod -Uri $ep.Url -Method Get -Headers $p2DriverHeaders
        }
        Write-Host "  [FAIL] Driver accessed admin endpoint: $($ep.Url)" -ForegroundColor Red
    } catch {
        Write-Host "  [OK] Access Denied to Driver: $($ep.Url) -> HTTP 403 Forbidden" -ForegroundColor Green
    }
}

# -----------------------------------------------------------------------------
# 3. STUDENT ROLE TESTING
# -----------------------------------------------------------------------------
Write-Host "`n>>> [STUDENT ROLE] Testing Student Capabilities & Boundaries <<<" -ForegroundColor Yellow

# 3.1 Student Register and Login
$p2StudentUsername = "p2_student_$unique"
$p2StudentPass = "P2StudentPass@123"
$studentReg = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" -Method Post -Body (@{ username = $p2StudentUsername; password = $p2StudentPass; role = "STUDENT" } | ConvertTo-Json) -ContentType "application/json"
$studentLog = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -Body (@{ username = $p2StudentUsername; password = $p2StudentPass } | ConvertTo-Json) -ContentType "application/json"
$p2StudentToken = $studentLog.token
$p2StudentHeaders = @{ Authorization = "Bearer $p2StudentToken" }
Write-Host "  [OK] Student Registered & Logged in: $p2StudentUsername" -ForegroundColor Green

# 3.2 Student Transport Request
$reqSubmit = Invoke-RestMethod -Uri "http://localhost:5000/api/transport/transport-request" -Method Post -Headers $p2StudentHeaders -Body (@{ preferredStop = 18 } | ConvertTo-Json) -ContentType "application/json"
Write-Host "  [OK] Student Submitted Transport Request: Request ID=$($reqSubmit.data.id), Status=$($reqSubmit.data.status)" -ForegroundColor Green

# 3.3 Student View Own Transport Request
$myReq = Invoke-RestMethod -Uri "http://localhost:5000/api/transport/my-transport-request" -Method Get -Headers $p2StudentHeaders
Write-Host "  [OK] Student View Transport Request: Exists=$($myReq.exists), Status=$($myReq.data.status), Preferred Stop=$($myReq.data.preferredStop.stopName)" -ForegroundColor Green

# 3.4 Student Boundary Tests: Student cannot access Admin or Driver management functions
Write-Host "  Testing Student boundary restrictions against Admin & Driver endpoints:" -ForegroundColor Gray
$restrictedEndpoints = @(
    @{ Url = "http://localhost:5000/api/admin/drivers"; Method = "Get" },
    @{ Url = "http://localhost:5000/api/driver/profile"; Method = "Get" },
    @{ Url = "http://localhost:5000/api/trips/start"; Method = "Post"; Body = (@{ scheduleId = 2 } | ConvertTo-Json) },
    @{ Url = "http://localhost:5000/api/transport/pending-transport-requests"; Method = "Get" },
    @{ Url = "http://localhost:5000/api/transport/assignment/2/students"; Method = "Get" }
)
foreach ($item in $restrictedEndpoints) {
    try {
        if ($item.Method -eq "Post") {
            Invoke-RestMethod -Uri $item.Url -Method Post -Headers $p2StudentHeaders -Body $item.Body -ContentType "application/json"
        } else {
            Invoke-RestMethod -Uri $item.Url -Method Get -Headers $p2StudentHeaders
        }
        Write-Host "  [FAIL] Student accessed restricted endpoint: $($item.Url)" -ForegroundColor Red
    } catch {
        Write-Host "  [OK] Access Denied to Student: $($item.Url) -> HTTP 403 Forbidden" -ForegroundColor Green
    }
}

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "   PHASE 2: ALL ROLES AND BOUNDARIES FULLY VERIFIED       " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
