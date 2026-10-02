<?php

session_start();

header(
    "Content-Type: application/json; charset=utf-8"
);

require __DIR__ . "/db.php";


if (
    (
        $_SESSION["role"]
        ??
        ""
    )
    !==
    "Admin"
) {

    http_response_code(
        403
    );


    echo json_encode(
        [

            "success" =>
                false,

            "message" =>
                "Akses ditolak."

        ]
    );


    exit;

}


$method =
    $_SERVER[
        "REQUEST_METHOD"
    ];


$data =
    json_decode(
        file_get_contents(
            "php://input"
        ),
        true
    )
    ??
    [];


/* =====================================================
   GENERATE USERNAME
===================================================== */

function usernameFromName(
    PDO $pdo,
    string $name
): string {

    $base =
        strtolower(
            trim(
                $name
            )
        );


    $base =
        preg_replace(
            '/[^a-z0-9]+/i',
            '.',
            $base
        );


    $base =
        trim(
            $base,
            '.'
        );


    if (
        $base ===
        ""
    ) {

        $base =
            "sales";

    }


    $username =
        $base;


    $number =
        2;


    $stmt =
        $pdo
            ->prepare(
                "
                    SELECT
                        COUNT(*)

                    FROM users

                    WHERE
                        username = ?
                "
            );


    while (
        true
    ) {

        $stmt->execute(
            [
                $username
            ]
        );


        if (
            (int)
            $stmt
                ->fetchColumn()
            ===
            0
        ) {

            return $username;

        }


        $username =
            $base
            .
            "."
            .
            $number++;


    }

}


try {

    /* =====================================================
       DELETE / NONAKTIFKAN
    ===================================================== */

    if (
        $method ===
        "DELETE"
    ) {

        /* ALL */

        if (
            (
                $_GET["all"]
                ??
                ""
            )
            ===
            "1"
        ) {

            $stmt =
                $pdo
                    ->prepare(
                        "
                            UPDATE users

                            SET
                                status =
                                'Nonaktif'

                            WHERE

                                role =
                                'Sales'

                                AND

                                status =
                                'Aktif'
                        "
                    );


            $stmt->execute();


            echo json_encode(
                [

                    "success" =>
                        true,

                    "message" =>
                        $stmt
                            ->rowCount()
                        .
                        " akun Sales dinonaktifkan."

                ]
            );


            exit;

        }


        $id =
            (int)
            (
                $_GET["id"]
                ??
                0
            );


        if (!$id) {

            throw new Exception(
                "ID Sales tidak valid."
            );

        }


        $stmt =
            $pdo
                ->prepare(
                    "
                        UPDATE users

                        SET
                            status =
                            'Nonaktif'

                        WHERE

                            id = ?

                            AND

                            role =
                            'Sales'
                    "
                );


        $stmt->execute(
            [
                $id
            ]
        );


        echo json_encode(
            [
                "success" =>
                    true
            ]
        );


        exit;

    }


    /* =====================================================
       DATA
    ===================================================== */

    $id =
        (int)
        (
            $data["id"]
            ??
            0
        );


    $fullName =
        trim(
            $data[
                "full_name"
            ]
            ??
            ""
        );


    $salesType =
        trim(
            $data[
                "sales_type"
            ]
            ??
            ""
        );


    $storeId =
        (int)
        (
            $data[
                "default_store_id"
            ]
            ??
            0
        );


    if (
        $fullName ===
        ""
    ) {

        throw new Exception(
            "Nama Sales wajib diisi."
        );

    }


    if (
        !in_array(
            $salesType,
            [
                "Walk-in",
                "Walk-out"
            ],
            true
        )
    ) {

        throw new Exception(
            "Kategori Sales tidak valid."
        );

    }


    if (!$storeId) {

        throw new Exception(
            "Store Terkait wajib dipilih."
        );

    }


    $channel =
        $salesType ===
        "Walk-out"

            ? "Outstore"

            : "Instore";


    /* =====================================================
       UPDATE
    ===================================================== */

    if (
        $method ===
        "PUT"
    ) {

        if (!$id) {

            throw new Exception(
                "ID Sales tidak valid."
            );

        }


        $stmt =
            $pdo
                ->prepare(
                    "
                        UPDATE users

                        SET

                            full_name = ?,

                            sales_type = ?,

                            channel = ?,

                            default_store_id = ?

                        WHERE

                            id = ?

                            AND

                            role =
                            'Sales'
                    "
                );


        $stmt->execute(
            [

                $fullName,

                $salesType,

                $channel,

                $storeId,

                $id

            ]
        );


        echo json_encode(
            [
                "success" =>
                    true
            ]
        );


        exit;

    }


    /* =====================================================
       INSERT
    ===================================================== */

    if (
        $method !==
        "POST"
    ) {

        http_response_code(
            405
        );


        throw new Exception(
            "Method tidak didukung."
        );

    }


    $username =
        usernameFromName(
            $pdo,
            $fullName
        );


    $password =
        "Sales123!";


    $hash =
        password_hash(
            $password,
            PASSWORD_DEFAULT
        );


    $stmt =
        $pdo
            ->prepare(
                "
                    INSERT INTO users
                    (
                        full_name,

                        username,

                        password,

                        role,

                        sales_type,

                        channel,

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
                "
            );


    $stmt->execute(
        [

            $fullName,

            $username,

            $hash,

            $salesType,

            $channel,

            $storeId

        ]
    );


    echo json_encode(
        [

            "success" =>
                true,

            "id" =>
                (int)
                $pdo
                    ->lastInsertId(),

            "username" =>
                $username,

            "default_password" =>
                $password

        ]
    );


} catch (
    PDOException $error
) {

    http_response_code(
        400
    );


    echo json_encode(
        [

            "success" =>
                false,

            "message" =>

                $error
                    ->getCode()
                ===
                "23000"

                    ? "Username atau data Sales sudah digunakan."

                    : $error
                        ->getMessage()

        ]
    );


} catch (
    Throwable $error
) {

    http_response_code(
        400
    );


    echo json_encode(
        [

            "success" =>
                false,

            "message" =>
                $error
                    ->getMessage()

        ]
    );

}