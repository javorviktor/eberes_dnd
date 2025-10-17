-- Drop all users and related data
-- This script removes all users and cascades to related tables

-- Delete in order to respect foreign key constraints
DELETE FROM "InstanceCharacter";
DELETE FROM "InstanceSession";
DELETE FROM "InstanceInvitation";
DELETE FROM "Instance";
DELETE FROM "User";

-- Show confirmation
SELECT 'All users and related data have been deleted' as message;
