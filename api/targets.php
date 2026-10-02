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
        INSERT INTO targets
        (
            period,
            sales_id,
            product,
            target_qty
        )

        VALUES
        (?, ?, ?, ?)

        ON DUPLICATE KEY UPDATE

            target_qty =
            VALUES(target_qty)
        "
    );


$stmt->execute([

    $data[
        "period"
    ],

    $data[
        "sales_id"
    ],

    $data[
        "product"
    ],

    $data[
        "target_qty"
    ]

]);


echo json_encode([
    "success" =>
        true
]);