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


try {

    /* DELETE */

    if (
        $method ===
        "DELETE"
    ) {

        /* DELETE ALL */

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
                            DELETE s
                            FROM stores s

                            LEFT JOIN users u

                                ON u.default_store_id =
                                s.id

                            LEFT JOIN transactions t

                                ON t.store_id =
                                s.id

                            LEFT JOIN visitors v

                                ON v.store_id =
                                s.id

                            WHERE

                                u.id IS NULL

                                AND

                                t.id IS NULL

                                AND

                                v.id IS NULL
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
                        " Store berhasil dihapus."

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
                "ID Store tidak valid."
            );

        }


        $stmt =
            $pdo
                ->prepare(
                    "
                        DELETE FROM stores

                        WHERE id = ?
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


    $id =
        (int)
        (
            $data["id"]
            ??
            0
        );


    $name =
        trim(
            $data[
                "store_name"
            ]
            ??
            ""
        );


    if (
        $name ===
        ""
    ) {

        throw new Exception(
            "Nama Store wajib diisi."
        );

    }


    /* UPDATE */

    if (
        $method ===
        "PUT"
    ) {

        if (!$id) {

            throw new Exception(
                "ID Store tidak valid."
            );

        }


        $stmt =
            $pdo
                ->prepare(
                    "
                        UPDATE stores

                        SET
                            store_name = ?

                        WHERE
                            id = ?
                    "
                );


        $stmt->execute(
            [

                $name,

                $id

            ]
        );


    /* INSERT */

    } elseif (
        $method ===
        "POST"
    ) {

        $stmt =
            $pdo
                ->prepare(
                    "
                        INSERT INTO stores
                        (
                            store_name
                        )

                        VALUES
                        (?)
                    "
                );


        $stmt->execute(
            [
                $name
            ]
        );


    } else {

        http_response_code(
            405
        );


        throw new Exception(
            "Method tidak didukung."
        );

    }


    echo json_encode(
        [
            "success" =>
                true
        ]
    );


} catch (
    PDOException $error
) {

    http_response_code(
        400
    );


    $message =
        $error
            ->getCode()
        ===
        "23000"

            ? "Store tidak dapat dihapus/ditambah karena duplikat atau masih dipakai data lain."

            : $error
                ->getMessage();


    echo json_encode(
        [

            "success" =>
                false,

            "message" =>
                $message

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