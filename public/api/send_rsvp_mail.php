<?php
// public/api/send_rsvp_mail.php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);
if (empty($data)) {
    $data = $_POST;
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {

    $familyName = strip_tags(trim($data["familyName"] ?? 'Famille Inconnue'));
    $email = filter_var(trim($data["email"] ?? ''), FILTER_SANITIZE_EMAIL);
    $message = strip_tags(trim($data["message"] ?? ''));
    $members = $data["members"] ?? [];

    $admin_email = "valentinetjean+rsvp@etik.com";
    $server_sender = "no-reply@valentine-et-jean.fr";
    $unique_id = substr(md5(time()), 0, 5);
    
    $attendingCount = 0;
    if (is_array($members)) {
        foreach ($members as $m) {
            if (!empty($m['isAttending'])) {
                $attendingCount++;
            }
        }
    }

    $status_global = $attendingCount > 0 ? "Présent(s)" : "Absent(s)";

    $email_subject = "[RSVP - $status_global] Mise à jour : $familyName";
    
    $email_content = "Bonjour,\n\n";
    $email_content .= "Vous avez reçu une nouvelle réponse (ou mise à jour) pour le mariage de la part de : $familyName.\n";
    if (!empty($email)) {
        $email_content .= "Email de contact : $email\n";
    }
    
    $email_content .= "\n=======================================\n";
    $email_content .= "DÉTAIL DES INVITÉS :\n";
    $email_content .= "=======================================\n\n";

    if (is_array($members) && count($members) > 0) {
        foreach ($members as $index => $m) {
            $firstName = strip_tags($m['firstName'] ?? '');
            $lastName = strip_tags($m['lastName'] ?? '');
            $isAttending = !empty($m['isAttending']) ? '✅ PRÉSENT(E)' : '❌ ABSENT(E)';
            $isChild = !empty($m['isChild']) ? '(Enfant)' : '(Adulte)';
            $dietary = strip_tags($m['dietaryRequirements'] ?? '');

            $email_content .= "- $firstName $lastName $isChild : $isAttending\n";
            if (!empty($dietary) && !empty($m['isAttending'])) {
                $email_content .= "  Régime/Allergies : $dietary\n";
            }
            $email_content .= "\n";
        }
    } else {
        $email_content .= "Aucun détail d'invité fourni.\n";
    }

    $email_content .= "=======================================\n";
    if (!empty($message)) {
        $email_content .= "MESSAGE LAISSÉ PAR LES INVITÉS :\n";
        $email_content .= "$message\n";
        $email_content .= "=======================================\n";
    }

    $email_content .= "\nCeci est un email automatique généré par votre site de mariage.\n";

    $headers_admin = "From: $familyName <$server_sender>" . "\r\n";
    if (!empty($email)) {
        $headers_admin .= "Reply-To: $email" . "\r\n";
    }
    $headers_admin .= "MIME-Version: 1.0" . "\r\n";
    $headers_admin .= "Content-Type: text/plain; charset=UTF-8" . "\r\n";
    $headers_admin .= "X-Mailer: PHP/" . phpversion();

    if (mail($admin_email, $email_subject, $email_content, $headers_admin)) {
        http_response_code(200);
        echo json_encode(["status" => "success", "message" => "RSVP notifié avec succès."]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Erreur d'envoi du mail RSVP."]);
    }

} else {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée."]);
}
?>
