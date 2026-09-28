<?php
// contact.php

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

if (!empty($data["website"])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Spam détecté."]);
    exit();
} 

if ($_SERVER["REQUEST_METHOD"] == "POST") {

    $nom = strip_tags(trim($data["nom"] ?? ''));
    $email = filter_var(trim($data["email"] ?? ''), FILTER_SANITIZE_EMAIL);
    $telephone = strip_tags(trim($data["telephone"] ?? ''));
    $sujet = strip_tags(trim($data["sujet"] ?? ''));
    $message = trim($data["message"] ?? '');

    if (empty($nom) || empty($message) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Veuillez remplir tous les champs correctement."]);
        exit();
    }

    $admin_email = "valentinetjean+formulaire@etik.com"; 
    $server_sender = "no-reply@valentine-et-jean.fr";
    $unique_id = substr(md5(time()), 0, 5);
    
    $email_subject = "[$nom] $sujet";
    
    $email_content = "Nom: $nom\n";
    $email_content .= "Email: $email\n";
    if (!empty($telephone)) {
        $email_content .= "Téléphone: $telephone\n";
    }
    $email_content .= "\nMessage:\n$message\n";

    $headers_admin = "From: $nom <$server_sender>" . "\r\n";
    $headers_admin .= "Reply-To: $email" . "\r\n";
    $headers_admin .= "MIME-Version: 1.0" . "\r\n";
    $headers_admin .= "Content-Type: text/plain; charset=UTF-8" . "\r\n";
    $headers_admin .= "X-Mailer: PHP/" . phpversion();

    if (mail($admin_email, $email_subject, $email_content, $headers_admin)) {
            
        $auto_subject = "Confirmation de réception de votre message";
        $auto_message = "Bonjour $nom,\n\n";
        $auto_message .= "Merci de nous avoir contactés pour notre mariage. Nous avons bien reçu votre message !\n\n";
        $auto_message .= "Nous vous répondrons très rapidement.\n\n";
        $auto_message .= "Valentine & Jean\n";

        $headers_client = "From: Valentine & Jean <$server_sender>" . "\r\n";
        $headers_client .= "Reply-To: $admin_email" . "\r\n";
        $headers_client .= "MIME-Version: 1.0" . "\r\n";
        $headers_client .= "Content-Type: text/plain; charset=UTF-8" . "\r\n";

        mail($email, $auto_subject, $auto_message, $headers_client);

        http_response_code(200);
        echo json_encode(["status" => "success", "message" => "Message envoyé avec succès."]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Une erreur est survenue lors de l'envoi."]);
    }

} else {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Méthode non autorisée."]);
}
?>
