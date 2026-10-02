<?php

header(
    "Content-Type: application/json; charset=utf-8"
);

require "db.php";


$salesData = [

    [
        "Muhammad Indrawansyah",
        "WI XLC BANJARMASIN",
        "Instore"
    ],

    [
        "Defika Firdiyani",
        "WI XLC SAMARINDA",
        "Instore"
    ],

    [
        "MUHAMMAD ASRIZA",
        "WI XLC PONTIANAK",
        "Instore"
    ],

    [
        "RIZKA NOVIYANTI",
        "WI XLC PONTIANAK",
        "Instore"
    ],

    [
        "ARIFIN",
        "WO XLC PONTIANAK",
        "Outstore"
    ],

    [
        "RENDY DARMAWAN",
        "WO XLC PONTIANAK",
        "Outstore"
    ],

    [
        "SRI ASWATI",
        "WO XLC PONTIANAK",
        "Outstore"
    ],

    [
        "JUWITA PUSPITA SARI",
        "EXPO HITAM MANIS BONTO BULAENG",
        "Outstore"
    ],

    [
        "AHMAD RIFKY FAISAL RAMADHANI",
        "WI XLC PALANGKARAYA",
        "Instore"
    ],

    [
        "EVA ARIANA",
        "WI XLC PALANGKARAYA",
        "Instore"
    ],

    [
        "ANGGER PANGESTU",
        "WO XLC PALANGKARAYA",
        "Outstore"
    ],

    [
        "REZA RAMADHAN",
        "WO XLC PALANGKARAYA",
        "Outstore"
    ],

    [
        "NADIA BARAKAH",
        "WO XLC PALANGKARAYA",
        "Outstore"
    ],

    [
        "MUHAMMAD JAMI ABDUROHIM",
        "WO XLC SAMARINDA",
        "Outstore"
    ],

    [
        "DIMAS ADELIA PUTMITASURI",
        "WO XLC SAMARINDA",
        "Outstore"
    ],

    [
        "ENNY KRISTINA",
        "WO XLC SAMARINDA",
        "Outstore"
    ],

    [
        "SITI MAYSARAH",
        "WO XLC SAMARINDA",
        "Outstore"
    ],

    [
        "AFRIANI",
        "WO XLC SAMARINDA",
        "Outstore"
    ],

    [
        "KRISNA DWI PROMONO",
        "WO XLC SAMARINDA",
        "Outstore"
    ],

    [
        "HENI MEILANI",
        "WI XLC BALIKPAPAN",
        "Instore"
    ],

    [
        "MARSHA CHELSEA ANGELICA SUALANG",
        "WI XLC BALIKPAPAN",
        "Instore"
    ],

    [
        "HARIN NAWAITUL WEZTY INDRA WARDANI",
        "EXPO HITAM MANIS BONTO BULAENG",
        "Outstore"
    ],

    [
        "HENDRIANI",
        "EXPO PLAT KT",
        "Outstore"
    ],

    [
        "SITI NOR ARAFAH",
        "EXPO PLAT KT",
        "Outstore"
    ],

    [
        "MITTA ANISYAH",
        "WI XLCE BALIKPAPAN BARU",
        "Instore"
    ],

    [
        "SERLY KARANGAN",
        "WO XLCE BALIKPAPAN BARU",
        "Outstore"
    ],

    [
        "WAHYUNI ANWAR",
        "WO XLCE BALIKPAPAN BARU",
        "Outstore"
    ],

    [
        "SITI MAJIDAH",
        "XLCM RANTAU",
        "Instore"
    ],

    [
        "ANIS KOIRUTUNISAH",
        "XLCM BATULICIN",
        "Instore"
    ],

    [
        "JENNIFER CHRYSEIS CEACILIA TANGKILISAN",
        "XLCM TANJUNG",
        "Instore"
    ]

];


function usernameFromName(
    $name
) {

    $username =
        strtolower(
            trim(
                $name
            )
        );


    $username =
        preg_replace(

            "/[^a-z0-9 ]/",

            "",

            $username

        );


    return preg_replace(

        "/\s+/",

        ".",

        $username

    );

}


try {

    $pdo->beginTransaction();


    /*
    =====================================================
    ADMIN
    =====================================================
    */

    $adminPassword =
        password_hash(

            "Admin123!",

            PASSWORD_DEFAULT

        );


    $stmt =
        $pdo->prepare(
            "
            INSERT INTO users
            (
                full_name,
                username,
                password,
                role,
                status
            )

            VALUES
            (
                'Administrator',
                'admin',
                ?,
                'Admin',
                'Aktif'
            )

            ON DUPLICATE KEY UPDATE

                full_name =
                VALUES(full_name)
            "
        );


    $stmt->execute([
        $adminPassword
    ]);


    /*
    =====================================================
    SALES
    =====================================================
    */

    foreach (
        $salesData
        as $sales
    ) {

        [
            $name,
            $store,
            $channel
        ] = $sales;


        /*
        STORE
        */

        $stmt =
            $pdo->prepare(
                "
                INSERT IGNORE INTO stores
                (
                    store_name
                )
                VALUES
                (?)
                "
            );


        $stmt->execute([
            $store
        ]);


        $stmt =
            $pdo->prepare(
                "
                SELECT id
                FROM stores
                WHERE store_name = ?
                LIMIT 1
                "
            );


        $stmt->execute([
            $store
        ]);


        $storeId =
            $stmt->fetchColumn();


        /*
        USERNAME
        */

        $username =
            usernameFromName(
                $name
            );


        /*
        SALES TYPE
        */

        $salesType =
            $channel ===
            "Outstore"
                ? "Walk-out"
                : "Walk-in";


        /*
        PASSWORD
        */

        $password =
            password_hash(

                "Sales123!",

                PASSWORD_DEFAULT

            );


        /*
        INSERT SALES
        */

        $stmt =
            $pdo->prepare(
                "
                INSERT INTO users
                (
                    full_name,
                    username,
                    password,
                    role,
                    channel,
                    sales_type,
                    default_store_id,
                    status
                )

                VALUES
                (
                    ?,
                    ?,
                    ?,
                    'Sales',
                    ?,
                    ?,
                    ?,
                    'Aktif'
                )

                ON DUPLICATE KEY UPDATE

                    full_name =
                    VALUES(full_name),

                    channel =
                    VALUES(channel),

                    sales_type =
                    VALUES(sales_type),

                    default_store_id =
                    VALUES(default_store_id)
                "
            );


        $stmt->execute([

            $name,

            $username,

            $password,

            $channel,

            $salesType,

            $storeId

        ]);

    }


    $pdo->commit();


    echo json_encode(
        [

            "success" =>
                true,

            "message" =>
                "Admin dan 30 akun Sales berhasil dibuat.",

            "admin" => [

                "username" =>
                    "admin",

                "password" =>
                    "Admin123!"

            ],

            "sales_default_password" =>
                "Sales123!"

        ],
        JSON_PRETTY_PRINT |
        JSON_UNESCAPED_UNICODE
    );


} catch (
    Throwable $e
) {

    if (
        $pdo->inTransaction()
    ) {

        $pdo->rollBack();

    }


    http_response_code(
        500
    );


    echo json_encode([

        "success" =>
            false,

        "message" =>
            $e->getMessage()

    ]);

}