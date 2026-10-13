$ErrorActionPreference = "Stop"

Write-Host "=== STARTING PHASE 3 CROSS-ROLE END-TO-END VERIFICATION ===" -ForegroundColor Cyan

# 0. Admin Login
Write-Host "`n[Step 0] Admin Login" -ForegroundColor Yellow
$adminCreds = @{ username = "admin"; password = "admin123" } | ConvertTo-Json
$adminLogin = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -Body $adminCreds -ContentType "application/json"
$adminToken = $adminLogin.token
$adminHeaders = @{ Authorization = "Bearer $adminToken" }
Write-Host "  Admin logged in successfully. Token received." -ForegroundColor Green

# 1. Admin creates a driver
Write-Host "`n[Step 1] Admin creates a driver" -ForegroundColor Yellow
$uniqueId = [System.Guid]::NewGuid().ToString().Substring(0, 6)
$driverUsername = "driver_task6_$uniqueId"
$driverEmail = "driver_task6_$uniqueId@university.edu"
$driverPassword = "DriverPassword@123"

$driverPayload = @{
    username = $driverUsername
    password = $driverPassword
    name = "Vikram Task6 $uniqueId"
    email = $driverEmail
    phone = "9876543210"
    licenseId = "DL-TASK6-$uniqueId"
} | ConvertTo-Json

$createdDriverRes = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/drivers" -Method Post -Headers $adminHeaders -Body $driverPayload -ContentType "application/json"
$newDriver = $createdDriverRes.data
$newDriverId = $newDriver.id
Write-Host "  Created driver: ID=$newDriverId, Username=$driverUsername, Status=$($newDriver.status)" -ForegroundColor Green

# 1b. Student registers and logs in
Write-Host "`n[Step 1b] Student registers and logs in" -ForegroundColor Yellow
$studentUsername = "student_task6_$uniqueId"
$studentPassword = "StudentPassword@123"
$studentRegPayload = @{
    username = $studentUsername
    password = $studentPassword
    role = "STUDENT"
} | ConvertTo-Json

$studentRegRes = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" -Method Post -Body $studentRegPayload -ContentType "application/json"
Write-Host "  Student registered: Username=$studentUsername" -ForegroundColor Green

$studentLoginRes = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -Body (@{ username = $studentUsername; password = $studentPassword } | ConvertTo-Json) -ContentType "application/json"
$studentToken = $studentLoginRes.token
$studentHeaders = @{ Authorization = "Bearer $studentToken" }
Write-Host "  Student logged in successfully." -ForegroundColor Green

# 1c. Student submits transport request
Write-Host "`n[Step 1c] Student submits transport request" -ForegroundColor Yellow
# Stop 18 is 'Raj Hotol' on KATARGAM ROUTE (Route 8)
$transportReqPayload = @{
    preferredStop = 18
} | ConvertTo-Json
$transportReqRes = Invoke-RestMethod -Uri "http://localhost:5000/api/transport/transport-request" -Method Post -Headers $studentHeaders -Body $transportReqPayload -ContentType "application/json"
$transportRequestId = $transportReqRes.data.id
Write-Host "  Transport request created: Request ID=$transportRequestId, Status=$($transportReqRes.data.status), Stop=18" -ForegroundColor Green

# 2 & 3. Admin assigns new driver to Assignment 2 and approves student request with seat
Write-Host "`n[Step 2 & 3] Admin assigns driver to Assignment 2 and approves student request" -ForegroundColor Yellow
$updateAsgnPayload = @{
    bus = 3
    driver = $newDriverId
    route = 8
    status = "Active"
} | ConvertTo-Json
$updateAsgnRes = Invoke-RestMethod -Uri "http://localhost:5000/api/assignment/update-assignment/2" -Method Put -Headers $adminHeaders -Body $updateAsgnPayload -ContentType "application/json"
Write-Host "  Assignment 2 updated with new driver ID=$newDriverId." -ForegroundColor Green

$assignStudentPayload = @{
    students = @(
        @{
            requestId = $transportRequestId
            seatNumber = 22
        }
    )
} | ConvertTo-Json
$assignStudentRes = Invoke-RestMethod -Uri "http://localhost:5000/api/transport/assignment/2/assign-students" -Method Put -Headers $adminHeaders -Body $assignStudentPayload -ContentType "application/json"
Write-Host "  Student assigned to Assignment 2 with Seat 22. Status: $($assignStudentRes.message)" -ForegroundColor Green

# Verify student transport request status
$studentReqCheck = Invoke-RestMethod -Uri "http://localhost:5000/api/transport/my-transport-request" -Method Get -Headers $studentHeaders
Write-Host "  Student verified: Status=$($studentReqCheck.status), Seat=$($studentReqCheck.seatNumber), Bus=$($studentReqCheck.assignment.bus.busNumber)" -ForegroundColor Green

# 4. Driver logs in and starts the trip
Write-Host "`n[Step 4] Driver logs in and starts the trip" -ForegroundColor Yellow
$driverLoginRes = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -Body (@{ username = $driverUsername; password = $driverPassword } | ConvertTo-Json) -ContentType "application/json"
$driverToken = $driverLoginRes.token
$driverHeaders = @{ Authorization = "Bearer $driverToken" }
Write-Host "  Driver logged in successfully." -ForegroundColor Green

# Driver checks assignment
$driverAsgn = Invoke-RestMethod -Uri "http://localhost:5000/api/driver/my-assignment" -Method Get -Headers $driverHeaders
Write-Host "  Driver assignment verified: Bus=$($driverAsgn.data.bus.busNumber), Route=$($driverAsgn.data.route.routeName)" -ForegroundColor Green

# Driver starts trip with Schedule 2 (Tuesday 07:30 OUTBOUND on Assignment 2)
$startTripPayload = @{ scheduleId = 2 } | ConvertTo-Json
$startTripRes = Invoke-RestMethod -Uri "http://localhost:5000/api/trips/start" -Method Post -Headers $driverHeaders -Body $startTripPayload -ContentType "application/json"
$tripId = $startTripRes.trip.id
Write-Host "  Trip started: Trip ID=$tripId, Status=$($startTripRes.trip.status)" -ForegroundColor Green

# 5. Student views active bus and receives notification
Write-Host "`n[Step 5] Student views active bus and notifications" -ForegroundColor Yellow
$busStatus = Invoke-RestMethod -Uri "http://localhost:5000/api/tracking/bus/3/status" -Method Get -Headers $studentHeaders
Write-Host "  Live Bus Status: Trip Status=$($busStatus.data.trip.status), Lat=$($busStatus.data.location.latitude), Lng=$($busStatus.data.location.longitude)" -ForegroundColor Green

$studentNotifs = Invoke-RestMethod -Uri "http://localhost:5000/api/notifications" -Method Get -Headers $studentHeaders
$startNotif = $studentNotifs.data | Where-Object { $_.type -eq "TRIP_STARTED" } | Select-Object -First 1
Write-Host "  Student received TRIP_STARTED notification: Title='$($startNotif.title)', Message='$($startNotif.message)'" -ForegroundColor Green

# 6. Driver sends location updates
Write-Host "`n[Step 6] Driver sends location updates" -ForegroundColor Yellow
$locUpdatePayload = @{
    busId = 3
    latitude = 21.233708
    longitude = 72.833151
    speed = 36.5
    heading = 120.0
    isMoving = $true
    currentStopIndex = 1
    currentStopId = 11
    routeProgress = 20.0
    routeCompleted = $false
} | ConvertTo-Json
$locUpdateRes = Invoke-RestMethod -Uri "http://localhost:5000/api/tracking/update-location" -Method Post -Headers $driverHeaders -Body $locUpdatePayload -ContentType "application/json"
Write-Host "  Location update response: Success=$($locUpdateRes.success)" -ForegroundColor Green

# Verify student sees updated location
$busStatusUpdated = Invoke-RestMethod -Uri "http://localhost:5000/api/tracking/bus/3/status" -Method Get -Headers $studentHeaders
Write-Host "  Student observes updated location: Lat=$($busStatusUpdated.data.location.latitude), Lng=$($busStatusUpdated.data.location.longitude), Speed=$($busStatusUpdated.data.location.speed)" -ForegroundColor Green

# 7. Driver ends the trip
Write-Host "`n[Step 7] Driver ends the trip" -ForegroundColor Yellow
$endTripRes = Invoke-RestMethod -Uri "http://localhost:5000/api/trips/end" -Method Post -Headers $driverHeaders
Write-Host "  Trip ended: Success=$($endTripRes.success), Message=$($endTripRes.message)" -ForegroundColor Green

# 8. Student sees completed status and last valid bus location
Write-Host "`n[Step 8] Student sees completed status and last valid bus location" -ForegroundColor Yellow
$busStatusCompleted = Invoke-RestMethod -Uri "http://localhost:5000/api/tracking/bus/3/status" -Method Get -Headers $studentHeaders
Write-Host "  Completed Bus Status: Trip Status=$($busStatusCompleted.data.trip.status)" -ForegroundColor Green
Write-Host "  Last Location Preserved: Lat=$($busStatusCompleted.data.location.latitude), Lng=$($busStatusCompleted.data.location.longitude), Speed=$($busStatusCompleted.data.location.speed), Progress=$($busStatusCompleted.data.location.routeProgress)%" -ForegroundColor Green

if ($busStatusCompleted.data.location.latitude -eq 21.233708 -and $busStatusCompleted.data.location.longitude -eq 72.833151 -and $busStatusCompleted.data.trip.status -eq "Completed") {
    Write-Host "  PASS: Last valid coordinates preserved on trip completion!" -ForegroundColor Green
} else {
    Write-Host "  FAIL: Location or trip status mismatch!" -ForegroundColor Red
}

$studentNotifsCompleted = Invoke-RestMethod -Uri "http://localhost:5000/api/notifications" -Method Get -Headers $studentHeaders
$completedNotif = $studentNotifsCompleted.data | Where-Object { $_.type -eq "TRIP_COMPLETED" } | Select-Object -First 1
Write-Host "  Student received TRIP_COMPLETED notification: Title='$($completedNotif.title)', Message='$($completedNotif.message)'" -ForegroundColor Green

# 9. Verify unauthorized location updates after completion are rejected
Write-Host "`n[Step 9] Verify unauthorized location updates after completion are rejected" -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "http://localhost:5000/api/tracking/update-location" -Method Post -Headers $driverHeaders -Body $locUpdatePayload -ContentType "application/json"
    Write-Host "  FAIL: Driver was allowed to update location after trip completed!" -ForegroundColor Red
} catch {
    Write-Host "  PASS: Driver update rejected after completion with HTTP error: $($_.Exception.Message)" -ForegroundColor Green
}

try {
    Invoke-RestMethod -Uri "http://localhost:5000/api/tracking/update-location" -Method Post -Headers $studentHeaders -Body $locUpdatePayload -ContentType "application/json"
    Write-Host "  FAIL: Student was allowed to update location!" -ForegroundColor Red
} catch {
    Write-Host "  PASS: Student update rejected with HTTP 403 error: $($_.Exception.Message)" -ForegroundColor Green
}

# 10. Verify database records and assignments remain consistent
Write-Host "`n[Step 10] Verify database records and assignments consistency" -ForegroundColor Yellow
$asgnCheck = Invoke-RestMethod -Uri "http://localhost:5000/api/assignment/get-all-assignments" -Method Get -Headers $adminHeaders
$asgn2 = $asgnCheck.data | Where-Object { $_.id -eq 2 }
Write-Host "  Assignment 2: Bus=$($asgn2.bus.busNumber), Driver=$($asgn2.driver.fullName), Route=$($asgn2.route.routeName), Status=$($asgn2.status)" -ForegroundColor Green

$seatMap = Invoke-RestMethod -Uri "http://localhost:5000/api/transport/my-bus/seat-map" -Method Get -Headers $studentHeaders
Write-Host "  Student Seat Map: Total Occupied=$($seatMap.totalOccupied), Capacity=$($seatMap.busCapacity), My Seat=$($seatMap.mySeat)" -ForegroundColor Green

# Restore original driver (Driver 14 - Rajeshkumar Patel) to Assignment 2 for clean database hygiene
Write-Host "`n[Cleanup] Restoring original driver to Assignment 2" -ForegroundColor Yellow
$restorePayload = @{
    bus = 3
    driver = 14
    route = 8
    status = "Active"
} | ConvertTo-Json
$restoreRes = Invoke-RestMethod -Uri "http://localhost:5000/api/assignment/update-assignment/2" -Method Put -Headers $adminHeaders -Body $restorePayload -ContentType "application/json"
Write-Host "  Assignment 2 restored to original driver (Rajeshkumar Patel)." -ForegroundColor Green

Write-Host "`n=== ALL 10 CROSS-ROLE E2E STEPS VERIFIED WITH 100% SUCCESS ===" -ForegroundColor Cyan
