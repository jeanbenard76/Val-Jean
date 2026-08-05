<?php
/**
 * Script PHP d'envoi d'emails RSVP pour hébergement classique (OVHcloud, Infomaniak, o2switch, Gandi)
 * Envoie un mail HTML formaté à valentinetjean@etik.com
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée. Utilisez POST.']);
    exit();
}

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!$data || !isset($data['familyName']) || !isset($data['members'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Données JSON invalides ou incomplètes.']);
    exit();
}

$familyName = htmlspecialchars($data['familyName']);
$guestEmail = htmlspecialchars($data['email'] ?? 'Non renseigné');
$guestMessage = htmlspecialchars($data['message'] ?? '');
$members = $data['members'];

$to = 'valentinetjean@etik.com';
$fromEmail = 'no-reply@' . ($_SERVER['SERVER_NAME'] ?? 'valentine-et-jean.fr');
$subject = "=?UTF-8?B?" . base64_encode("💍 Confirmation RSVP : Famille " . $familyName) . "?=";

// Count attendance
$attendingCount = 0;
$totalCount = count($members);
$membersRows = '';

foreach ($members as $m) {
    $firstName = htmlspecialchars($m['firstName'] ?? '');
    $lastName = htmlspecialchars($m['lastName'] ?? '');
    $isChild = !empty($m['isChild']) ? 'Enfant' : 'Adulte';
    $isAttending = !empty($m['isAttending']);
    
    if ($isAttending) {
        $attendingCount++;
        $statusText = '<span style="color: #2e7d32; font-weight: bold;">✅ PRÉSENT(E)</span>';
        
        $events = [];
        if (!empty($m['events']['vinHonneur'])) $events[] = "Vin d'Honneur";
        if (!empty($m['events']['repasNoces'])) $events[] = "Repas de Noces";
        if (!empty($m['events']['brunchLendemain'])) $events[] = "Brunch";
        $eventsText = count($events) > 0 ? implode(', ', $events) : 'Aucun événement';
    } else {
        $statusText = '<span style="color: #c62828; font-weight: bold;">❌ ABSENT(E)</span>';
        $eventsText = '-';
    }

    $dietary = !empty($m['dietaryNotes']) ? htmlspecialchars($m['dietaryNotes']) : '-';

    $membersRows .= "
        <tr style='border-bottom: 1px solid #eee;'>
            <td style='padding: 10px; font-weight: bold; color: #13263B;'>{$firstName} {$lastName} ({$isChild})</td>
            <td style='padding: 10px;'>{$statusText}</td>
            <td style='padding: 10px; color: #555;'>{$eventsText}</td>
            <td style='padding: 10px; color: #555;'>{$dietary}</td>
        </tr>
    ";
}

$htmlBody = "
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
</head>
<body style='font-family: Arial, sans-serif; background-color: #faf7f2; padding: 20px; margin: 0;'>
    <div style='max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0;'>
        <h2 style='color: #13263B; border-bottom: 2px solid #C4A475; padding-bottom: 8px; margin-top: 0;'>
            💍 Nouvelle Confirmation RSVP
        </h2>
        <p style='font-size: 15px; color: #333;'>
            La <strong>Famille {$familyName}</strong> a validé sa réponse sur le site !
        </p>

        <div style='background-color: #faf7f2; padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid #e0dcd5;'>
            <p style='margin: 4px 0;'><strong>Famille :</strong> {$familyName}</p>
            <p style='margin: 4px 0;'><strong>Email de contact :</strong> <a href='mailto:{$guestEmail}'>{$guestEmail}</a></p>
            <p style='margin: 4px 0;'><strong>Bilan présence :</strong> {$attendingCount} présent(s) sur {$totalCount} invité(s)</p>
            " . ($guestMessage ? "<p style='margin: 10px 0 0 0; padding-top: 8px; border-top: 1px italic #eee;'><strong>Message des invités :</strong><br><em style='color: #3B6FA0;'>« {$guestMessage} »</em></p>" : "") . "
        </div>

        <h3 style='color: #13263B; font-size: 16px;'>Détails des personnes :</h3>
        <table style='width: 100%; border-collapse: collapse; font-size: 13px;'>
            <thead>
                <tr style='background-color: #13263B; color: #ffffff; text-align: left;'>
                    <th style='padding: 10px;'>Invité</th>
                    <th style='padding: 10px;'>Statut</th>
                    <th style='padding: 10px;'>Événements</th>
                    <th style='padding: 10px;'>Régime / Allergies</th>
                </tr>
            </thead>
            <tbody>
                {$membersRows}
            </tbody>
        </table>

        <p style='font-size: 11px; color: #888; text-align: center; margin-top: 25px;'>
            Notification automatique envoyée à <strong>{$to}</strong> via le script PHP du site Valentine &amp; Jean.
        </p>
    </div>
</body>
</html>
";

$headers = [];
$headers[] = 'MIME-Version: 1.0';
$headers[] = 'Content-type: text/html; charset=utf-8';
$headers[] = 'From: Mariage Valentine & Jean <' . $fromEmail . '>';
$headers[] = 'Reply-To: ' . ($guestEmail !== 'Non renseigné' ? $guestEmail : $fromEmail);
$headers[] = 'X-Mailer: PHP/' . phpversion();

$sent = mail($to, $subject, $htmlBody, implode("\r\n", $headers));

if ($sent) {
    echo json_encode([
        'success' => true,
        'message' => 'Email transmis avec succès à ' . $to . ' via PHP mail()'
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Erreur lors de l\'envoi de l\'email via la fonction mail() de PHP.'
    ]);
}
