--
-- PostgreSQL database dumps
--

\restrict AKeaBVvAo1NdtBuiDDCPye8A3CNed2lt9cTDhcJAb0tkPy6ZkRLdti5dVcPKmyd

-- Dumped from database version 17.7
-- Dumped by pg_dump version 17.7

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP DATABASE IF EXISTS "food_compare";
--
-- Name: food_compare; Type: DATABASE; Schema: -; Owner: -
--

CREATE DATABASE "food_compare" WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'de_AT.UTF-8';


\unrestrict AKeaBVvAo1NdtBuiDDCPye8A3CNed2lt9cTDhcJAb0tkPy6ZkRLdti5dVcPKmyd
\connect "food_compare"
\restrict AKeaBVvAo1NdtBuiDDCPye8A3CNed2lt9cTDhcJAb0tkPy6ZkRLdti5dVcPKmyd

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: SCHEMA "public"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA "public" IS 'standard public schema';


--
-- Name: citext; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "citext" WITH SCHEMA "public";


--
-- Name: EXTENSION "citext"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "citext" IS 'data type for case-insensitive character strings';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "public";


--
-- Name: EXTENSION "pgcrypto"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "pgcrypto" IS 'cryptographic functions';


SET default_tablespace = '';

SET default_table_access_method = "heap";

--
-- Name: badge; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."badge" (
                                  "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
                                  "name" "text" NOT NULL,
                                  "badge_type" "text",
                                  "description" "text"
);


--
-- Name: badge_image; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."badge_image" (
                                        "badge_id" "uuid" NOT NULL,
                                        "image_id" "uuid" NOT NULL
);


--
-- Name: category; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."category" (
                                     "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
                                     "retailer_id" "uuid" NOT NULL,
                                     "external_category_id" "text",
                                     "name" "text" NOT NULL,
                                     "path" "text",
                                     "parent_id" "uuid"
);


--
-- Name: image; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."image" (
                                  "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
                                  "owner_type" "text" NOT NULL,
                                  "owner_id" "uuid" NOT NULL,
                                  "url" "text" NOT NULL,
                                  "alt_text" "text",
                                  "width" integer,
                                  "height" integer,
                                  "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
                                  CONSTRAINT "image_owner_type_check" CHECK (("owner_type" = ANY (ARRAY['product'::"text", 'offer'::"text", 'badge'::"text"])))
);


--
-- Name: offer; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."offer" (
                                  "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
                                  "product_id" "uuid" NOT NULL,
                                  "retailer_id" "uuid" NOT NULL,
                                  "external_product_id" "text" NOT NULL,
                                  "product_url" "text",
                                  "size_text" "text",
                                  "unit_quantity" numeric,
                                  "unit" "text",
                                  "is_bulk" boolean,
                                  "fetched_at" timestamp with time zone NOT NULL
);


--
-- Name: offer_availability; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."offer_availability" (
                                               "offer_id" "uuid" NOT NULL,
                                               "store_id" "uuid" NOT NULL,
                                               "available" boolean NOT NULL
);


--
-- Name: offer_badge; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."offer_badge" (
                                        "offer_id" "uuid" NOT NULL,
                                        "badge_id" "uuid" NOT NULL
);


--
-- Name: offer_category; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."offer_category" (
                                           "offer_id" "uuid" NOT NULL,
                                           "category_id" "uuid" NOT NULL
);


--
-- Name: price; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."price" (
                                  "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
                                  "offer_id" "uuid" NOT NULL,
                                  "price" numeric NOT NULL,
                                  "currency" "text" NOT NULL,
                                  "base_price" numeric,
                                  "base_unit" "text",
                                  "old_price" numeric,
                                  "discount_text" "text",
                                  "valid_from" timestamp with time zone,
                                  "valid_to" timestamp with time zone,
                                  "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: product; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."product" (
                                    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
                                    "global_name" "text" NOT NULL,
                                    "brand_name" "text",
                                    "description_text" "text",
                                    "ingredients_text" "text",
                                    "nutrition_text" "text",
                                    "allergen_text" "text",
                                    "origin_text" "text",
                                    "extra_attributes" "jsonb",
                                    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
                                    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: raw_source_payload; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."raw_source_payload" (
                                               "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
                                               "offer_id" "uuid" NOT NULL,
                                               "retailer_code" "text" NOT NULL,
                                               "payload" "jsonb" NOT NULL,
                                               "fetched_at" timestamp with time zone NOT NULL
);


--
-- Name: retailer; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."retailer" (
                                     "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
                                     "code" "text" NOT NULL,
                                     "display_name" "text" NOT NULL,
                                     "country" "text" DEFAULT 'AT'::"text" NOT NULL,
                                     "website_url" "text",
                                     "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: store; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."store" (
                                  "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
                                  "retailer_id" "uuid" NOT NULL,
                                  "external_store_id" "text" NOT NULL,
                                  "name" "text",
                                  "address" "text",
                                  "lat" numeric,
                                  "lon" numeric
);


--
-- Name: badge_image badge_image_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."badge_image"
    ADD CONSTRAINT "badge_image_pkey" PRIMARY KEY ("badge_id", "image_id");


--
-- Name: badge badge_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."badge"
    ADD CONSTRAINT "badge_pkey" PRIMARY KEY ("id");


--
-- Name: category category_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."category"
    ADD CONSTRAINT "category_pkey" PRIMARY KEY ("id");


--
-- Name: category category_retailer_id_external_category_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."category"
    ADD CONSTRAINT "category_retailer_id_external_category_id_key" UNIQUE ("retailer_id", "external_category_id");


--
-- Name: image image_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."image"
    ADD CONSTRAINT "image_pkey" PRIMARY KEY ("id");


--
-- Name: offer_availability offer_availability_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."offer_availability"
    ADD CONSTRAINT "offer_availability_pkey" PRIMARY KEY ("offer_id", "store_id");


--
-- Name: offer_badge offer_badge_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."offer_badge"
    ADD CONSTRAINT "offer_badge_pkey" PRIMARY KEY ("offer_id", "badge_id");


--
-- Name: offer_category offer_category_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."offer_category"
    ADD CONSTRAINT "offer_category_pkey" PRIMARY KEY ("offer_id", "category_id");


--
-- Name: offer offer_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."offer"
    ADD CONSTRAINT "offer_pkey" PRIMARY KEY ("id");


--
-- Name: offer offer_retailer_id_external_product_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."offer"
    ADD CONSTRAINT "offer_retailer_id_external_product_id_key" UNIQUE ("retailer_id", "external_product_id");


--
-- Name: price price_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."price"
    ADD CONSTRAINT "price_pkey" PRIMARY KEY ("id");


--
-- Name: product product_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."product"
    ADD CONSTRAINT "product_pkey" PRIMARY KEY ("id");


--
-- Name: raw_source_payload raw_source_payload_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."raw_source_payload"
    ADD CONSTRAINT "raw_source_payload_pkey" PRIMARY KEY ("id");


--
-- Name: retailer retailer_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."retailer"
    ADD CONSTRAINT "retailer_code_key" UNIQUE ("code");


--
-- Name: retailer retailer_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."retailer"
    ADD CONSTRAINT "retailer_pkey" PRIMARY KEY ("id");


--
-- Name: store store_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."store"
    ADD CONSTRAINT "store_pkey" PRIMARY KEY ("id");


--
-- Name: store store_retailer_id_external_store_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."store"
    ADD CONSTRAINT "store_retailer_id_external_store_id_key" UNIQUE ("retailer_id", "external_store_id");


--
-- Name: idx_category_parent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_category_parent" ON "public"."category" USING "btree" ("parent_id");


--
-- Name: idx_offer_product; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_offer_product" ON "public"."offer" USING "btree" ("product_id");


--
-- Name: idx_offer_retailer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_offer_retailer" ON "public"."offer" USING "btree" ("retailer_id");


--
-- Name: idx_price_offer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_price_offer" ON "public"."price" USING "btree" ("offer_id");


--
-- Name: idx_raw_payload_json; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_raw_payload_json" ON "public"."raw_source_payload" USING "gin" ("payload");


--
-- Name: badge_image badge_image_badge_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."badge_image"
    ADD CONSTRAINT "badge_image_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "public"."badge"("id");


--
-- Name: badge_image badge_image_image_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."badge_image"
    ADD CONSTRAINT "badge_image_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "public"."image"("id");


--
-- Name: category category_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."category"
    ADD CONSTRAINT "category_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."category"("id");


--
-- Name: category category_retailer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."category"
    ADD CONSTRAINT "category_retailer_id_fkey" FOREIGN KEY ("retailer_id") REFERENCES "public"."retailer"("id");


--
-- Name: offer_availability offer_availability_offer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."offer_availability"
    ADD CONSTRAINT "offer_availability_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "public"."offer"("id");


--
-- Name: offer_availability offer_availability_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."offer_availability"
    ADD CONSTRAINT "offer_availability_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."store"("id");


--
-- Name: offer_badge offer_badge_badge_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."offer_badge"
    ADD CONSTRAINT "offer_badge_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "public"."badge"("id");


--
-- Name: offer_badge offer_badge_offer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."offer_badge"
    ADD CONSTRAINT "offer_badge_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "public"."offer"("id");


--
-- Name: offer_category offer_category_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."offer_category"
    ADD CONSTRAINT "offer_category_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id");


--
-- Name: offer_category offer_category_offer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."offer_category"
    ADD CONSTRAINT "offer_category_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "public"."offer"("id");


--
-- Name: offer offer_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."offer"
    ADD CONSTRAINT "offer_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id");


--
-- Name: offer offer_retailer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."offer"
    ADD CONSTRAINT "offer_retailer_id_fkey" FOREIGN KEY ("retailer_id") REFERENCES "public"."retailer"("id");


--
-- Name: price price_offer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."price"
    ADD CONSTRAINT "price_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "public"."offer"("id");


--
-- Name: raw_source_payload raw_source_payload_offer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."raw_source_payload"
    ADD CONSTRAINT "raw_source_payload_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "public"."offer"("id");


--
-- Name: store store_retailer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."store"
    ADD CONSTRAINT "store_retailer_id_fkey" FOREIGN KEY ("retailer_id") REFERENCES "public"."retailer"("id");


--
-- PostgreSQL database dumps complete
--

\unrestrict AKeaBVvAo1NdtBuiDDCPye8A3CNed2lt9cTDhcJAb0tkPy6ZkRLdti5dVcPKmyd

