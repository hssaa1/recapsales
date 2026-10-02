<?php

session_start();

header(
    "Content-Type: application/json"
);

require "db.php";


if (
    ($_SESSION["role"] ?? "") !==
    "Admin"
) {

    http_response_code(
        403
    );

    exit;

}


$data =
    json_decode(
        file_get_contents(
            "php://input"
        ),
        true
    );


$stmt =
    $pdo->prepare(
        "
        INSERT INTO visitors
        (
            visitor_date,
            store_id,
            visitor_count
        )

        VALUES
        (?, ?, ?)
        "
    );


$stmt->execute([

    $data[
        "visitor_date"
    ],

    $data[
        "store_id"
    ],

    $data[
        "visitor_count"
    ]

]);


echo json_encode([
    "success" =>
        true
]);