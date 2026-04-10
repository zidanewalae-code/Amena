-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : sam. 28 mars 2026 à 01:41
-- Version du serveur : 10.4.32-MariaDB
-- Version de PHP : 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `amena`
--

-- --------------------------------------------------------

--
-- Structure de la table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `actor_user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `action_name` varchar(120) NOT NULL,
  `entity_type` varchar(80) NOT NULL,
  `entity_id` bigint(20) UNSIGNED DEFAULT NULL,
  `old_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`old_values`)),
  `new_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`new_values`)),
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `beneficiaries`
--

CREATE TABLE `beneficiaries` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `national_id_hash` varchar(255) DEFAULT NULL,
  `household_size` int(11) DEFAULT NULL,
  `vulnerability_level` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `checkout_orders`
--

CREATE TABLE `checkout_orders` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `donor_user_id` bigint(20) UNSIGNED NOT NULL,
  `cart_id` bigint(20) UNSIGNED NOT NULL,
  `order_reference` varchar(40) NOT NULL,
  `total_amount` decimal(14,2) NOT NULL,
  `currency` char(3) NOT NULL DEFAULT 'TND',
  `payment_status` enum('pending','authorized','paid','failed','refunded','partially_refunded') NOT NULL DEFAULT 'pending',
  `placed_at` datetime NOT NULL DEFAULT current_timestamp(),
  `paid_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ;

-- --------------------------------------------------------

--
-- Structure de la table `checkout_order_items`
--

CREATE TABLE `checkout_order_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `checkout_order_id` bigint(20) UNSIGNED NOT NULL,
  `need_id` bigint(20) UNSIGNED NOT NULL,
  `amount` decimal(14,2) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ;

-- --------------------------------------------------------

--
-- Structure de la table `companies`
--

CREATE TABLE `companies` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `company_name` varchar(180) NOT NULL,
  `industry` varchar(120) DEFAULT NULL,
  `rse_budget` decimal(14,2) NOT NULL DEFAULT 0.00,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `courier_profiles`
--

CREATE TABLE `courier_profiles` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `courier_type` enum('volunteer','partner') NOT NULL DEFAULT 'volunteer',
  `vehicle_type` enum('foot','bike','motorbike','car','van') NOT NULL DEFAULT 'motorbike',
  `service_zone` varchar(180) DEFAULT NULL,
  `verification_status` enum('pending','verified','rejected','suspended') NOT NULL DEFAULT 'pending',
  `trust_score` decimal(5,2) NOT NULL DEFAULT 0.00,
  `total_missions` int(11) NOT NULL DEFAULT 0,
  `successful_missions` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `courier_ratings`
--

CREATE TABLE `courier_ratings` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `mission_id` bigint(20) UNSIGNED NOT NULL,
  `courier_user_id` bigint(20) UNSIGNED NOT NULL,
  `rater_user_id` bigint(20) UNSIGNED NOT NULL,
  `rating` tinyint(3) UNSIGNED NOT NULL,
  `comment_text` varchar(500) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ;

-- --------------------------------------------------------

--
-- Structure de la table `delivery_events`
--

CREATE TABLE `delivery_events` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `mission_id` bigint(20) UNSIGNED NOT NULL,
  `event_type` enum('created','assigned','picked_up','en_route','arrived','delivered','failed','disputed','canceled') NOT NULL,
  `event_note` varchar(500) DEFAULT NULL,
  `actor_user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `delivery_missions`
--

CREATE TABLE `delivery_missions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `need_id` bigint(20) UNSIGNED NOT NULL,
  `donation_id` bigint(20) UNSIGNED DEFAULT NULL,
  `courier_user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `pickup_address` varchar(255) DEFAULT NULL,
  `dropoff_address` varchar(255) NOT NULL,
  `scheduled_at` datetime DEFAULT NULL,
  `started_at` datetime DEFAULT NULL,
  `delivered_at` datetime DEFAULT NULL,
  `status` enum('to_assign','assigned','in_progress','delivered','failed','disputed','canceled') NOT NULL DEFAULT 'to_assign',
  `created_by_user_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `delivery_proofs`
--

CREATE TABLE `delivery_proofs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `mission_id` bigint(20) UNSIGNED NOT NULL,
  `photo_url` varchar(500) DEFAULT NULL,
  `signature_url` varchar(500) DEFAULT NULL,
  `otp_hash` varchar(255) DEFAULT NULL,
  `gps_lat` decimal(10,7) DEFAULT NULL,
  `gps_lng` decimal(10,7) DEFAULT NULL,
  `captured_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `donations`
--

CREATE TABLE `donations` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `checkout_order_id` bigint(20) UNSIGNED NOT NULL,
  `payment_transaction_id` bigint(20) UNSIGNED DEFAULT NULL,
  `donor_user_id` bigint(20) UNSIGNED NOT NULL,
  `need_id` bigint(20) UNSIGNED NOT NULL,
  `amount` decimal(14,2) NOT NULL,
  `currency` char(3) NOT NULL DEFAULT 'TND',
  `status` enum('pending','confirmed','failed','refunded') NOT NULL DEFAULT 'pending',
  `confirmed_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ;

-- --------------------------------------------------------

--
-- Structure de la table `donation_carts`
--

CREATE TABLE `donation_carts` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `donor_user_id` bigint(20) UNSIGNED NOT NULL,
  `status` enum('active','checked_out','abandoned') NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `donation_cart_items`
--

CREATE TABLE `donation_cart_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `cart_id` bigint(20) UNSIGNED NOT NULL,
  `need_id` bigint(20) UNSIGNED NOT NULL,
  `amount` decimal(14,2) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ;

-- --------------------------------------------------------

--
-- Structure de la table `needs`
--

CREATE TABLE `needs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `organization_id` bigint(20) UNSIGNED DEFAULT NULL,
  `beneficiary_id` bigint(20) UNSIGNED DEFAULT NULL,
  `title` varchar(220) NOT NULL,
  `description` text NOT NULL,
  `category` enum('food','medical','education','housing','emergency','other') NOT NULL DEFAULT 'other',
  `urgency_level` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
  `amount_target` decimal(14,2) NOT NULL,
  `amount_collected` decimal(14,2) NOT NULL DEFAULT 0.00,
  `currency` char(3) NOT NULL DEFAULT 'TND',
  `status` enum('draft','under_review','published','partially_funded','funded','closed','rejected') NOT NULL DEFAULT 'draft',
  `published_at` datetime DEFAULT NULL,
  `closed_at` datetime DEFAULT NULL,
  `created_by_user_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ;

-- --------------------------------------------------------

--
-- Structure de la table `need_updates`
--

CREATE TABLE `need_updates` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `need_id` bigint(20) UNSIGNED NOT NULL,
  `update_text` text NOT NULL,
  `proof_url` varchar(500) DEFAULT NULL,
  `created_by_user_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `notifications`
--

CREATE TABLE `notifications` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `channel` enum('in_app','email','sms','push') NOT NULL DEFAULT 'in_app',
  `title` varchar(180) NOT NULL,
  `body` text NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `sent_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `organizations`
--

CREATE TABLE `organizations` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `legal_name` varchar(180) NOT NULL,
  `registration_number` varchar(100) DEFAULT NULL,
  `tax_id` varchar(100) DEFAULT NULL,
  `address_line` varchar(255) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `governorate` varchar(100) DEFAULT NULL,
  `country` varchar(100) DEFAULT 'Tunisia',
  `verified_status` enum('pending','verified','rejected','suspended') NOT NULL DEFAULT 'pending',
  `verified_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `organization_verifications`
--

CREATE TABLE `organization_verifications` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `organization_id` bigint(20) UNSIGNED NOT NULL,
  `document_type` enum('legal_registration','tax_document','bank_proof','other') NOT NULL,
  `document_url` varchar(500) NOT NULL,
  `review_status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `reviewer_user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `comment_text` varchar(500) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `payment_transactions`
--

CREATE TABLE `payment_transactions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `checkout_order_id` bigint(20) UNSIGNED NOT NULL,
  `provider_name` varchar(80) NOT NULL,
  `provider_txn_id` varchar(120) DEFAULT NULL,
  `idempotency_key` varchar(120) DEFAULT NULL,
  `status` enum('initiated','pending','succeeded','failed','canceled','refunded') NOT NULL DEFAULT 'initiated',
  `amount` decimal(14,2) NOT NULL,
  `currency` char(3) NOT NULL DEFAULT 'TND',
  `failure_reason` varchar(255) DEFAULT NULL,
  `raw_payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`raw_payload`)),
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `ratings`
--

CREATE TABLE `ratings` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `target_type` enum('need','organization','courier') NOT NULL,
  `target_id` bigint(20) UNSIGNED NOT NULL,
  `rater_user_id` bigint(20) UNSIGNED NOT NULL,
  `rating` tinyint(3) UNSIGNED NOT NULL,
  `comment_text` varchar(500) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ;

-- --------------------------------------------------------

--
-- Structure de la table `trust_scores`
--

CREATE TABLE `trust_scores` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `target_type` enum('organization','courier') NOT NULL,
  `target_id` bigint(20) UNSIGNED NOT NULL,
  `score` decimal(5,2) NOT NULL DEFAULT 0.00,
  `score_details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`score_details`)),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `full_name` varchar(120) NOT NULL,
  `email` varchar(160) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('donor','association','beneficiary','company','courier','admin') NOT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `email_verified_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_audit_actor` (`actor_user_id`),
  ADD KEY `idx_audit_entity` (`entity_type`,`entity_id`);

--
-- Index pour la table `beneficiaries`
--
ALTER TABLE `beneficiaries`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

--
-- Index pour la table `checkout_orders`
--
ALTER TABLE `checkout_orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `order_reference` (`order_reference`),
  ADD KEY `fk_order_cart` (`cart_id`),
  ADD KEY `idx_order_donor_status` (`donor_user_id`,`payment_status`);

--
-- Index pour la table `checkout_order_items`
--
ALTER TABLE `checkout_order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_orderitem_order` (`checkout_order_id`),
  ADD KEY `fk_orderitem_need` (`need_id`);

--
-- Index pour la table `companies`
--
ALTER TABLE `companies`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

--
-- Index pour la table `courier_profiles`
--
ALTER TABLE `courier_profiles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

--
-- Index pour la table `courier_ratings`
--
ALTER TABLE `courier_ratings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_cr_mission` (`mission_id`),
  ADD KEY `fk_cr_courier` (`courier_user_id`),
  ADD KEY `fk_cr_rater` (`rater_user_id`);

--
-- Index pour la table `delivery_events`
--
ALTER TABLE `delivery_events`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_devent_mission` (`mission_id`),
  ADD KEY `fk_devent_actor` (`actor_user_id`);

--
-- Index pour la table `delivery_missions`
--
ALTER TABLE `delivery_missions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_mission_need` (`need_id`),
  ADD KEY `fk_mission_donation` (`donation_id`),
  ADD KEY `fk_mission_courier` (`courier_user_id`),
  ADD KEY `fk_mission_creator` (`created_by_user_id`),
  ADD KEY `idx_mission_status_sched` (`status`,`scheduled_at`);

--
-- Index pour la table `delivery_proofs`
--
ALTER TABLE `delivery_proofs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_dproof_mission` (`mission_id`);

--
-- Index pour la table `donations`
--
ALTER TABLE `donations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_don_order` (`checkout_order_id`),
  ADD KEY `fk_don_payment` (`payment_transaction_id`),
  ADD KEY `idx_donations_donor_date` (`donor_user_id`,`created_at`),
  ADD KEY `idx_donations_need_status` (`need_id`,`status`);

--
-- Index pour la table `donation_carts`
--
ALTER TABLE `donation_carts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_cart_donor_status` (`donor_user_id`,`status`);

--
-- Index pour la table `donation_cart_items`
--
ALTER TABLE `donation_cart_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_cart_need` (`cart_id`,`need_id`),
  ADD KEY `fk_cartitem_need` (`need_id`);

--
-- Index pour la table `needs`
--
ALTER TABLE `needs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_needs_org` (`organization_id`),
  ADD KEY `fk_needs_benef` (`beneficiary_id`),
  ADD KEY `fk_needs_creator` (`created_by_user_id`),
  ADD KEY `idx_needs_status` (`status`),
  ADD KEY `idx_needs_category` (`category`),
  ADD KEY `idx_needs_urgency` (`urgency_level`);

--
-- Index pour la table `need_updates`
--
ALTER TABLE `need_updates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_nupd_need` (`need_id`),
  ADD KEY `fk_nupd_user` (`created_by_user_id`);

--
-- Index pour la table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_notifications_user_read` (`user_id`,`is_read`);

--
-- Index pour la table `organizations`
--
ALTER TABLE `organizations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD KEY `idx_org_verified` (`verified_status`);

--
-- Index pour la table `organization_verifications`
--
ALTER TABLE `organization_verifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_orgver_org` (`organization_id`),
  ADD KEY `fk_orgver_reviewer` (`reviewer_user_id`);

--
-- Index pour la table `payment_transactions`
--
ALTER TABLE `payment_transactions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `idempotency_key` (`idempotency_key`),
  ADD KEY `idx_payment_order_status` (`checkout_order_id`,`status`);

--
-- Index pour la table `ratings`
--
ALTER TABLE `ratings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_ratings_rater` (`rater_user_id`);

--
-- Index pour la table `trust_scores`
--
ALTER TABLE `trust_scores`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_trust_target` (`target_type`,`target_id`);

--
-- Index pour la table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_users_role` (`role`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `beneficiaries`
--
ALTER TABLE `beneficiaries`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `checkout_orders`
--
ALTER TABLE `checkout_orders`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `checkout_order_items`
--
ALTER TABLE `checkout_order_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `companies`
--
ALTER TABLE `companies`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `courier_profiles`
--
ALTER TABLE `courier_profiles`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `courier_ratings`
--
ALTER TABLE `courier_ratings`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `delivery_events`
--
ALTER TABLE `delivery_events`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `delivery_missions`
--
ALTER TABLE `delivery_missions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `delivery_proofs`
--
ALTER TABLE `delivery_proofs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `donations`
--
ALTER TABLE `donations`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `donation_carts`
--
ALTER TABLE `donation_carts`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `donation_cart_items`
--
ALTER TABLE `donation_cart_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `needs`
--
ALTER TABLE `needs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `need_updates`
--
ALTER TABLE `need_updates`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `organizations`
--
ALTER TABLE `organizations`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `organization_verifications`
--
ALTER TABLE `organization_verifications`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `payment_transactions`
--
ALTER TABLE `payment_transactions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `ratings`
--
ALTER TABLE `ratings`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `trust_scores`
--
ALTER TABLE `trust_scores`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `fk_audit_actor` FOREIGN KEY (`actor_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `beneficiaries`
--
ALTER TABLE `beneficiaries`
  ADD CONSTRAINT `fk_benef_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `checkout_orders`
--
ALTER TABLE `checkout_orders`
  ADD CONSTRAINT `fk_order_cart` FOREIGN KEY (`cart_id`) REFERENCES `donation_carts` (`id`),
  ADD CONSTRAINT `fk_order_donor` FOREIGN KEY (`donor_user_id`) REFERENCES `users` (`id`);

--
-- Contraintes pour la table `checkout_order_items`
--
ALTER TABLE `checkout_order_items`
  ADD CONSTRAINT `fk_orderitem_need` FOREIGN KEY (`need_id`) REFERENCES `needs` (`id`),
  ADD CONSTRAINT `fk_orderitem_order` FOREIGN KEY (`checkout_order_id`) REFERENCES `checkout_orders` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `companies`
--
ALTER TABLE `companies`
  ADD CONSTRAINT `fk_company_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `courier_profiles`
--
ALTER TABLE `courier_profiles`
  ADD CONSTRAINT `fk_courier_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `courier_ratings`
--
ALTER TABLE `courier_ratings`
  ADD CONSTRAINT `fk_cr_courier` FOREIGN KEY (`courier_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_cr_mission` FOREIGN KEY (`mission_id`) REFERENCES `delivery_missions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_cr_rater` FOREIGN KEY (`rater_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `delivery_events`
--
ALTER TABLE `delivery_events`
  ADD CONSTRAINT `fk_devent_actor` FOREIGN KEY (`actor_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_devent_mission` FOREIGN KEY (`mission_id`) REFERENCES `delivery_missions` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `delivery_missions`
--
ALTER TABLE `delivery_missions`
  ADD CONSTRAINT `fk_mission_courier` FOREIGN KEY (`courier_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_mission_creator` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `fk_mission_donation` FOREIGN KEY (`donation_id`) REFERENCES `donations` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_mission_need` FOREIGN KEY (`need_id`) REFERENCES `needs` (`id`);

--
-- Contraintes pour la table `delivery_proofs`
--
ALTER TABLE `delivery_proofs`
  ADD CONSTRAINT `fk_dproof_mission` FOREIGN KEY (`mission_id`) REFERENCES `delivery_missions` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `donations`
--
ALTER TABLE `donations`
  ADD CONSTRAINT `fk_don_donor` FOREIGN KEY (`donor_user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `fk_don_need` FOREIGN KEY (`need_id`) REFERENCES `needs` (`id`),
  ADD CONSTRAINT `fk_don_order` FOREIGN KEY (`checkout_order_id`) REFERENCES `checkout_orders` (`id`),
  ADD CONSTRAINT `fk_don_payment` FOREIGN KEY (`payment_transaction_id`) REFERENCES `payment_transactions` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `donation_carts`
--
ALTER TABLE `donation_carts`
  ADD CONSTRAINT `fk_cart_donor` FOREIGN KEY (`donor_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `donation_cart_items`
--
ALTER TABLE `donation_cart_items`
  ADD CONSTRAINT `fk_cartitem_cart` FOREIGN KEY (`cart_id`) REFERENCES `donation_carts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_cartitem_need` FOREIGN KEY (`need_id`) REFERENCES `needs` (`id`);

--
-- Contraintes pour la table `needs`
--
ALTER TABLE `needs`
  ADD CONSTRAINT `fk_needs_benef` FOREIGN KEY (`beneficiary_id`) REFERENCES `beneficiaries` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_needs_creator` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `fk_needs_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `need_updates`
--
ALTER TABLE `need_updates`
  ADD CONSTRAINT `fk_nupd_need` FOREIGN KEY (`need_id`) REFERENCES `needs` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_nupd_user` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`);

--
-- Contraintes pour la table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `fk_notif_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `organizations`
--
ALTER TABLE `organizations`
  ADD CONSTRAINT `fk_org_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `organization_verifications`
--
ALTER TABLE `organization_verifications`
  ADD CONSTRAINT `fk_orgver_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_orgver_reviewer` FOREIGN KEY (`reviewer_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `payment_transactions`
--
ALTER TABLE `payment_transactions`
  ADD CONSTRAINT `fk_pay_order` FOREIGN KEY (`checkout_order_id`) REFERENCES `checkout_orders` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `ratings`
--
ALTER TABLE `ratings`
  ADD CONSTRAINT `fk_ratings_rater` FOREIGN KEY (`rater_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

-- --------------------------------------------------------
-- Durcissement schema (integrite metier)
-- --------------------------------------------------------

ALTER TABLE `users`
  MODIFY `role` enum('donor','organization','beneficiary','company','courier','admin') NOT NULL;

ALTER TABLE `courier_profiles`
  ADD CONSTRAINT `chk_courier_mission_counts` CHECK (`successful_missions` <= `total_missions`);

ALTER TABLE `courier_ratings`
  ADD CONSTRAINT `chk_courier_rating_range` CHECK (`rating` BETWEEN 1 AND 5),
  ADD CONSTRAINT `uq_courier_rating_per_mission_rater` UNIQUE (`mission_id`,`rater_user_id`);

ALTER TABLE `ratings`
  ADD CONSTRAINT `chk_rating_range` CHECK (`rating` BETWEEN 1 AND 5),
  ADD CONSTRAINT `uq_rating_once_per_target` UNIQUE (`target_type`,`target_id`,`rater_user_id`);

ALTER TABLE `needs`
  ADD CONSTRAINT `chk_needs_amount_target_positive` CHECK (`amount_target` > 0),
  ADD CONSTRAINT `chk_needs_amount_collected_nonnegative` CHECK (`amount_collected` >= 0),
  ADD CONSTRAINT `chk_needs_amount_collected_lte_target` CHECK (`amount_collected` <= `amount_target`);

ALTER TABLE `donation_cart_items`
  ADD CONSTRAINT `chk_cart_item_amount_positive` CHECK (`amount` > 0);

ALTER TABLE `checkout_orders`
  ADD CONSTRAINT `chk_checkout_order_total_positive` CHECK (`total_amount` > 0);

ALTER TABLE `checkout_order_items`
  ADD CONSTRAINT `chk_checkout_order_item_amount_positive` CHECK (`amount` > 0),
  ADD CONSTRAINT `uq_checkout_order_need` UNIQUE (`checkout_order_id`,`need_id`);

ALTER TABLE `payment_transactions`
  ADD CONSTRAINT `chk_payment_amount_positive` CHECK (`amount` > 0);

ALTER TABLE `donations`
  ADD CONSTRAINT `chk_donation_amount_positive` CHECK (`amount` > 0),
  ADD CONSTRAINT `uq_donation_order_need` UNIQUE (`checkout_order_id`,`need_id`);

ALTER TABLE `delivery_proofs`
  ADD CONSTRAINT `chk_delivery_proof_lat_range` CHECK (`gps_lat` IS NULL OR (`gps_lat` BETWEEN -90 AND 90)),
  ADD CONSTRAINT `chk_delivery_proof_lng_range` CHECK (`gps_lng` IS NULL OR (`gps_lng` BETWEEN -180 AND 180));

ALTER TABLE `delivery_missions`
  ADD CONSTRAINT `chk_delivery_time_sequence` CHECK (
    (`started_at` IS NULL OR `scheduled_at` IS NULL OR `started_at` >= `scheduled_at`)
    AND (`delivered_at` IS NULL OR `started_at` IS NULL OR `delivered_at` >= `started_at`)
  );

ALTER TABLE `needs`
  ADD KEY `idx_needs_status_urgency` (`status`,`urgency_level`),
  ADD KEY `idx_needs_org_status` (`organization_id`,`status`);

ALTER TABLE `donations`
  ADD KEY `idx_donations_status_created` (`status`,`created_at`);

ALTER TABLE `delivery_events`
  ADD KEY `idx_delivery_events_mission_created` (`mission_id`,`created_at`);

ALTER TABLE `notifications`
  ADD KEY `idx_notifications_user_created` (`user_id`,`created_at`);

-- --------------------------------------------------------
-- Sprint 5: performance and webhook idempotence
-- --------------------------------------------------------

ALTER TABLE `donation_orders`
  ADD KEY `idx_donation_orders_donor_created` (`donor_user_id`,`created_at`),
  ADD KEY `idx_donation_orders_status_created` (`status`,`created_at`);

ALTER TABLE `donations`
  ADD KEY `idx_donations_need_created` (`need_id`,`created_at`),
  ADD KEY `idx_donations_donor_created` (`donor_user_id`,`created_at`);

CREATE TABLE IF NOT EXISTS `payment_webhook_events` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `provider_name` varchar(40) NOT NULL,
  `event_id` varchar(140) NOT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`payload`)),
  `processed_at` datetime NOT NULL DEFAULT current_timestamp(),
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_payment_webhook_event` (`event_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
