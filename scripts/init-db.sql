-- Docker Init Script
-- Wird automatisch beim ersten Start des MySQL-Containers ausgeführt

CREATE DATABASE IF NOT EXISTS `metin2_cms`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Hinweis: User wird bereits über Docker-Env angelegt
-- Hier können zusätzliche Grants ergänzt werden
