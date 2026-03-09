-- Debug script to check if user exists and what's wrong
-- Run this in your database to debug the authentication issue

-- 1. Check if user exists at all
SELECT 'USER_EXISTS_CHECK' as debug_step, 
       COUNT(*) as user_count
FROM utilisateurs 
WHERE email = 'patrick@gmail.com';

-- 1b. Get user details if exists
SELECT 'USER_DETAILS' as debug_step,
       email,
       statut,
       id_user,
       nom,
       prenom,
       created_at
FROM utilisateurs 
WHERE email = 'patrick@gmail.com';

-- 2. Check user with all related data (same query as function)
SELECT 'FULL_USER_QUERY' as debug_step,
    u.id_user,
    u.nom,
    u.prenom,
    u.email,
    u.mot_de_passe,
    u.id_role,
    u.id_entreprise,
    u.statut,
    u.first_time_login,
    r.libelle as role_libelle,
    e.nom_commercial as entreprise_nom
FROM utilisateurs u
LEFT JOIN roles r ON u.id_role = r.id_role
LEFT JOIN entreprises e ON u.id_entreprise = e.id_entreprise
WHERE u.email = 'patrick@gmail.com' AND u.statut = 'actif';

-- 3. Test the function directly
SELECT 'FUNCTION_TEST' as debug_step, * FROM verify_user_password('patrick@gmail.com', 'test123');

-- 4. List all users to see what exists
SELECT 'ALL_USERS' as debug_step, 
       email, 
       statut, 
       nom, 
       prenom,
       created_at
FROM utilisateurs 
ORDER BY created_at DESC 
LIMIT 10;
