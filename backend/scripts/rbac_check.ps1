$base = 'http://localhost:5000/api'
$ts = Get-Date -Format yyyyMMddHHmmss
function J($method, $uri, $token = $null, $body = $null) {
  $params = @{ Method = $method; Uri = $uri }
  if ($token) { $params.Headers = @{ Authorization = "Bearer $token" } }
  if ($body) { $params.ContentType = 'application/json'; $params.Body = ($body | ConvertTo-Json) }
  Invoke-RestMethod @params
}
function C($name, $expected, [scriptblock]$sb) {
  try {
    $r = & $sb
    [pscustomobject]@{ name = $name; expected = $expected; status = 200; pass = ($expected -eq 200); detail = ($r | ConvertTo-Json -Compress -Depth 8) }
  } catch {
    $c = $_.Exception.Response.StatusCode.value__
    [pscustomobject]@{ name = $name; expected = $expected; status = $c; pass = ($c -eq $expected); detail = $_.ErrorDetails.Message }
  }
}

$don = J Post "$base/auth/register" $null @{ name = 'DonRBAC'; email = "don.rbac.$ts@amena.local"; password = 'Test123!'; role = 'donator' }
$org = J Post "$base/auth/register" $null @{ name = 'OrgRBAC'; email = "org.rbac.$ts@amena.local"; password = 'Test123!'; role = 'organization' }
$del = J Post "$base/auth/register" $null @{ name = 'DelRBAC'; email = "del.rbac.$ts@amena.local"; password = 'Test123!'; role = 'delivery_person' }

$tokDon = $don.token
$tokOrg = $org.token
$tokDel = $del.token

$results = @()
$results += C 'delivery_products_forbidden' 403 { J Get "$base/products" $tokDel }
$results += C 'donator_users_forbidden' 403 { J Get "$base/users" $tokDon }
$results += C 'organization_payments_forbidden' 403 { J Get "$base/payments" $tokOrg }
$results += C 'invalid_token_orders_401' 401 { J Get "$base/orders" 'bad.token.value' }

$alert = J Post "$base/alerts" $tokOrg @{ title = 'Org alert'; description = 'org only'; priority = 'high' }
$results += C 'delivery_cannot_read_org_private_alert' 403 { J Get "$base/alerts/$($alert.alert_id)" $tokDel }
$pub = J Post "$base/alerts" $tokOrg @{ title = 'Public alert'; description = 'visible'; priority = 'public' }
$results += C 'delivery_can_read_public_alert' 200 { J Get "$base/alerts/$($pub.alert_id)" $tokDel }

$order = J Post "$base/orders" $tokDon @{ delivery_address = 'A'; status = 'pending' }
$null = J Put "$base/orders/$($order.order_id)" $tokOrg @{ delivery_person_id = $del.user.user_id; status = 'assigned' }
$notif = J Post "$base/notifications" $tokDon @{ message = 'donator notif'; order_id = $order.order_id }

$results += C 'donator_can_read_own_notification' 200 { J Get "$base/notifications/$($notif.notification_id)" $tokDon }
$results += C 'delivery_cannot_delete_donator_notification' 403 { J Delete "$base/notifications/$($notif.notification_id)" $tokDel }
$results += C 'donator_notification_list_isolated' 200 { J Get "$base/notifications" $tokDon }

$results | ConvertTo-Json -Depth 8