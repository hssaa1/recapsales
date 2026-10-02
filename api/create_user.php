<?php

require "db.php";

$fullName = "MUHAMMAD INDRAWANSYAH";
$username = "indrawansyah";
$password = "sales123";
$role = "Sales";
$salesType = "Walk-in";
$defaultStoreId = 1;

$hashedPassword = password_hash(
    $password,
    PASSWORD_DEFAULT
);

$stmt = $pdo->prepare("
    INSERT INTO users
    (
        full_name,
        username,
        password,
        role,
        sales_type,
        default_store_id
    )
    VALUES
    (?, ?, ?, ?, ?, ?)
");

$stmt->execute([
    $fullName,
    $username,
    $hashedPassword,
    $role,
    $salesType,
    $defaultStoreId
]);

echo "User berhasil dibuat";