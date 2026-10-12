--
-- PostgreSQL database dump
--

\restrict gClL7KKLGB61bvaz2Zgi3rGvJyBMYkp8qPaN173l5WmHIH82XxaYlGb9Kw4rlEJ

-- Dumped from database version 18.6 (Ubuntu 18.6-0ubuntu0.26.04.1)
-- Dumped by pg_dump version 18.6 (Ubuntu 18.6-0ubuntu0.26.04.1)

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
-- Data for Name: Role; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Role" (id, name, "createdAt") FROM stdin;
1	ADMIN	2026-10-03 20:04:07.248
2	CLIENT	2026-10-03 20:04:07.257
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."User" (id, name, email, "passwordHash", phone, "roleId", "createdAt", "updatedAt") FROM stdin;
1	Shryxa Admin	sukumarpoddar90@gmail.com	$2b$12$O6.dr3TfYRNDT.sXN0doB.Vtqn/Fs/Gjq3i9gppEj/6EFbAppxITO	\N	1	2026-10-03 20:04:07.49	2026-10-03 20:04:07.49
2	Bunty Poddar	buntypoddar90@gmail.com	$2b$12$2egjNVnofbRiqYZ5K2q9iOM.2kq74oWcsiB5rD1a3.t7dl3J5igUu	8210633753	2	2026-10-05 11:04:31.016	2026-10-05 11:04:31.016
3	Raju Poddar	rajupoddar90@gmail.com	$2b$12$S4UZnrLwVMo5f6eFoqRmEenQhyFWERSd7VufRT2mf.9UzDSxXhNm6	6206297928	2	2026-10-05 11:29:12.197	2026-10-05 11:29:12.197
4	Vimla Devi	vimal@gmail.com	$2b$12$EuV2wV2c5QtRBPaORrgQ9ux6DZPplnFyIyhFtdl8n0QukicM5/Eau	6206297928	2	2026-10-06 10:38:25.248	2026-10-06 10:38:25.248
5	RAJU PODDAR	rajupoddar@gmail.com	$2b$12$9rLuxCsKAuW130C9f092eOlsLLuLprAisLBUY10Azx4g1hHVkRvxW	6206297928	2	2026-10-06 11:00:04.069	2026-10-06 11:00:04.069
6	Raju Poddar	raju@gmail.com	$2b$12$9QyspqbRVPAHB76Rb2cS/OfAgdoIB7wTdN3KAYDMez98XbQOo09tu	6206297928	2	2026-10-06 11:08:05.767	2026-10-06 11:08:05.767
7	Sukumar	sukumar90@gmail.com	$2b$12$MMTSN.5obWLCqzTi.2iKCOGkUUsjefhUqG8YV6ZeBea4J3HLPScDS	6206297928	2	2026-10-08 18:19:22.233	2026-10-08 18:19:22.233
8	sukumar	sukumar@gmail.com	$2b$12$Dbsd7D8WsVu6LcOOwdw5tet.BDJZ2uBgz7N/bWPeWOMH8LiyBGRIu	287654378	2	2026-10-08 18:34:16.63	2026-10-08 18:34:16.63
9	sukumar 	su@gmai.com	$2b$12$ieADKqkGyCn03Q5I5zP99.65yTOEfoPs5Pmnjxq.sRZ.LGJfip0uO	7654325678	2	2026-10-08 18:37:29.256	2026-10-08 18:37:29.256
10	Sukumar Poddar	sukumarpoddar80@gmail.com	$2b$12$8DOGWvQEqWH//JGWP6j4DucuP4k1EbGXrlbBhejtfsjyb9yctK9fC	06206297928	2	2026-10-08 18:41:27	2026-10-08 18:41:27
11	jdjkd	qwkjdkjq@gmail.com	$2b$12$T0xpIrKxfijuJb6/yHr6MO2bgLuumKbVZdi8.A4Dng8F9PrhDXzwu	87483749842	2	2026-10-08 19:07:47.654	2026-10-08 19:07:47.654
12	Bunty	poddarsukumar2000@gmail.com	$2b$12$lMpqcAf1o9xAoPlFAmbPGeOYOQTDxadUejYNE1yep.Yo8HcQ.ksLe	6206297928	2	2026-10-10 17:55:40.171	2026-10-10 17:55:40.171
13	ss	yjjd@gmail.com	$2b$12$VIGKFns6k4swfFwPQYeZWuCD15cQzsp6COrtqRySV4dEHdpJOEtTi	8798334	2	2026-10-11 04:13:37.021	2026-10-11 04:13:37.021
14	sukumar	sk@gmail.com	$2b$12$eGjrRcuaS.fRQH.8IIWh8.Lpq.XDGlaCIfyZZgs.Vho6Rf.sa0ttO	6206297928	2	2026-10-11 11:03:57.755	2026-10-11 11:03:57.755
\.


--
-- Data for Name: Business; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Business" (id, "ownerId", "shopName", "ownerName", phone, address, "pinCode", "googleReviewUrl", status, "createdAt", "updatedAt") FROM stdin;
1	6	Raju Enterprises	Raju Poddar	7645328970	Madhu Bazar Chaibasa	833201	https://www.google.com/maps/place/Palash+Aajivika+didi+cafe/@22.5481096,85.8023499,17z/data=!4m15!1m7!3m6!1s0x3a1e27ebe16bd723:0x6877a5d440fa26a8!2sPoddar+Sukumar!8m2!3d22.5481096!4d85.8049248!16s%2Fg%2F11frqs1c0x!3m6!1s0x3a1e27003a7dbc09:0x39073c6c0bfec1fc!8m2!3d22.5470077!4d85.8074999!10e1!16s%2Fg%2F11nq0v7yf6?entry=ttu&g_ep=EgoyMDI2MDkzMC4wIKXMDSoASAFQAw%3D%3D	PENDING_PAYMENT	2026-10-06 11:08:55.821	2026-10-06 11:08:55.821
2	12	Poddar Ventures	Sukumar	6206297928	Madhu Bazar Chaibasa	833201	https://chatgpt.com/	PENDING_PAYMENT	2026-10-10 17:56:58.589	2026-10-10 17:56:58.589
3	13	ndkl	dsdsmdn	43242335345	Mumbai mahatarhtra	21432445	https://dashboard.razorpay.com/app/website-app-settings/webhooks	PENDING_PAYMENT	2026-10-11 04:14:24.643	2026-10-11 04:14:24.643
4	14	ABC restro	Sunil	583821383912738	cacasasd	12321	shryxa.com	PENDING_PAYMENT	2026-10-11 11:04:26.14	2026-10-11 11:04:26.14
\.


--
-- Data for Name: Product; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Product" (id, name, description, price, currency, "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Order; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Order" (id, "businessId", "productId", quantity, "unitPrice", "totalAmount", currency, status, "recipientName", "recipientPhone", "addressLine1", "addressLine2", city, state, "pinCode", country, "fulfilmentStatus", "shippingProvider", "trackingNumber", "shippedAt", "deliveredAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Subscription; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Subscription" (id, "businessId", "planName", amount, currency, "interval", provider, "providerPlanId", "providerSubscriptionId", status, "startDate", "currentPeriodStart", "currentPeriodEnd", "nextBillingAt", "cancelAtPeriodEnd", "cancelledAt", "endedAt", "createdAt", "updatedAt") FROM stdin;
1	3	MONTHLY	199.00	INR	MONTHLY	RAZORPAY	plan_TmMLUWJgQehtrA	sub_TmSuzLaVItHl8x	CREATED	\N	\N	\N	\N	f	\N	\N	2026-10-11 04:14:35.391	2026-10-11 04:14:38.802
2	4	MONTHLY	199.00	INR	MONTHLY	RAZORPAY	plan_TmMLUWJgQehtrA	sub_TmZu3clGParxNj	ACTIVE	\N	\N	\N	\N	f	\N	\N	2026-10-11 11:04:34.834	2026-10-11 11:06:51.517
\.


--
-- Data for Name: Payment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Payment" (id, "businessId", provider, "providerPaymentId", amount, currency, status, "paidAt", "createdAt", "providerOrderId", "subscriptionId", "updatedAt", "orderId") FROM stdin;
1	4	RAZORPAY	pay_TmZvavg4yxKpw4	199.00	INR	SUCCESS	2026-10-11 11:06:04	2026-10-11 11:06:51.489	\N	2	2026-10-11 11:06:51.489	\N
\.


--
-- Data for Name: QRCode; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."QRCode" (id, "businessId", "qrIdentifier", "destinationUrl", status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
14018b55-eeac-489a-bce9-739d9ac5d094	63d7c863dadaba93313748b1147721f11742b0b279ef416dda720800219b318d	2026-10-04 00:43:38.835462+05:30	20261003191338_init	\N	\N	2026-10-04 00:43:38.794741+05:30	1
0aee670e-3118-456a-b5f2-611d37c5c19e	2be0203576296d76efce70df76a718c01158aa48061099c853ad5ff80caa0368	2026-10-09 23:19:53.489489+05:30	20261009174953_add_subscriptions_and_update_payments	\N	\N	2026-10-09 23:19:53.454315+05:30	1
91e3b6d1-d7e4-4872-b4c4-4307f24ae096	cad4a6d72f74ecc753a9e969a6996b3506688a323a30b2904cfcb9246e5e25c7	2026-10-09 23:44:18.431733+05:30	20261009181418_add_standee_orders	\N	\N	2026-10-09 23:44:18.406605+05:30	1
\.


--
-- Name: Business_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Business_id_seq"', 4, true);


--
-- Name: Order_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Order_id_seq"', 1, false);


--
-- Name: Payment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Payment_id_seq"', 1, true);


--
-- Name: Product_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Product_id_seq"', 1, false);


--
-- Name: QRCode_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."QRCode_id_seq"', 1, false);


--
-- Name: Role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Role_id_seq"', 2, true);


--
-- Name: Subscription_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Subscription_id_seq"', 2, true);


--
-- Name: User_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."User_id_seq"', 14, true);


--
-- PostgreSQL database dump complete
--

\unrestrict gClL7KKLGB61bvaz2Zgi3rGvJyBMYkp8qPaN173l5WmHIH82XxaYlGb9Kw4rlEJ

