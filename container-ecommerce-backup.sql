--
-- PostgreSQL database dump
--

\restrict CopGHjJL3t60n19SzQd6qhwOG1eSC2OnyeW9nbRfTQD7pdaguKFe6Dtkp4zy5rk

-- Dumped from database version 15.15 (Debian 15.15-1.pgdg13+1)
-- Dumped by pg_dump version 15.15 (Debian 15.15-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: addresses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.addresses (
    id integer NOT NULL,
    user_id integer,
    full_name text NOT NULL,
    phone text,
    line1 text NOT NULL,
    line2 text,
    city text,
    state text,
    postal_code text,
    country text DEFAULT 'VN'::text,
    is_default boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.addresses OWNER TO postgres;

--
-- Name: addresses_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.addresses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.addresses_id_seq OWNER TO postgres;

--
-- Name: addresses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.addresses_id_seq OWNED BY public.addresses.id;


--
-- Name: banners; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.banners (
    id integer NOT NULL,
    title text,
    subtitle text,
    image_url text,
    link text,
    type text DEFAULT 'promo'::text,
    accent text,
    priority integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.banners OWNER TO postgres;

--
-- Name: banners_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.banners_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.banners_id_seq OWNER TO postgres;

--
-- Name: banners_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.banners_id_seq OWNED BY public.banners.id;


--
-- Name: cart; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cart (
    id integer NOT NULL,
    user_id integer
);


ALTER TABLE public.cart OWNER TO postgres;

--
-- Name: cart_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cart_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.cart_id_seq OWNER TO postgres;

--
-- Name: cart_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cart_id_seq OWNED BY public.cart.id;


--
-- Name: cart_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cart_items (
    id integer NOT NULL,
    cart_id integer,
    product_id integer,
    qty integer DEFAULT 1
);


ALTER TABLE public.cart_items OWNER TO postgres;

--
-- Name: cart_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cart_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.cart_items_id_seq OWNER TO postgres;

--
-- Name: cart_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cart_items_id_seq OWNED BY public.cart_items.id;


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_items (
    id integer NOT NULL,
    order_id integer,
    product_id integer,
    quantity integer,
    price numeric
);


ALTER TABLE public.order_items OWNER TO postgres;

--
-- Name: order_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.order_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.order_items_id_seq OWNER TO postgres;

--
-- Name: order_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.order_items_id_seq OWNED BY public.order_items.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    user_id integer,
    total numeric,
    payment_method text,
    status text DEFAULT 'pending'::text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    address_id integer,
    ship_method character varying(20) DEFAULT 'standard'::character varying,
    shipping_fee numeric(10,2) DEFAULT 0,
    cancelled_at timestamp without time zone,
    cancellation_reason text
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.orders_id_seq OWNER TO postgres;

--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    id integer NOT NULL,
    name text NOT NULL,
    price numeric NOT NULL,
    short_description text,
    description text,
    image text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    slug text,
    stock integer DEFAULT 0
);


ALTER TABLE public.products OWNER TO postgres;

--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.products_id_seq OWNER TO postgres;

--
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    role text DEFAULT 'user'::text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: addresses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.addresses ALTER COLUMN id SET DEFAULT nextval('public.addresses_id_seq'::regclass);


--
-- Name: banners id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.banners ALTER COLUMN id SET DEFAULT nextval('public.banners_id_seq'::regclass);


--
-- Name: cart id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart ALTER COLUMN id SET DEFAULT nextval('public.cart_id_seq'::regclass);


--
-- Name: cart_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_items ALTER COLUMN id SET DEFAULT nextval('public.cart_items_id_seq'::regclass);


--
-- Name: order_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items ALTER COLUMN id SET DEFAULT nextval('public.order_items_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- Name: products id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: addresses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.addresses (id, user_id, full_name, phone, line1, line2, city, state, postal_code, country, is_default, created_at) FROM stdin;
1	3	duongle	09898987767	02 duong test	\N	Da Nang	\N	\N	VN	t	2025-11-19 16:12:03.275667
\.


--
-- Data for Name: banners; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.banners (id, title, subtitle, image_url, link, type, accent, priority, created_at) FROM stdin;
2	Smartphone Week	Top models at discounted prices.	https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3&s=placeholder	/products	promo	#00b4d8	5	2025-11-19 15:31:52.975469
3	Accessories Clearance	Chargers, cables and cases at low prices.	https://images.unsplash.com/photo-1503602642458-232111445657?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3&s=placeholder	/products	promo	#ff8a3d	4	2025-11-19 15:31:52.975469
1	Big Savings on Laptops	Get up to 30% off selected laptops this week	https://cdn-media.sforum.vn/storage/app/media/Van%20Pham/7/hinh-nen-desktop-1.jpg	/products	hero	#ff6a00	10	2025-11-19 15:31:52.975469
\.


--
-- Data for Name: cart; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cart (id, user_id) FROM stdin;
1	2
2	3
\.


--
-- Data for Name: cart_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cart_items (id, cart_id, product_id, qty) FROM stdin;
1	2	3	1
2	1	11	1
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_items (id, order_id, product_id, quantity, price) FROM stdin;
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (id, user_id, total, payment_method, status, created_at, address_id, ship_method, shipping_fee, cancelled_at, cancellation_reason) FROM stdin;
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (id, name, price, short_description, description, image, created_at, slug, stock) FROM stdin;
1	iPhone 17 256GB | Chính hãng	990	\N	Apple iPhone 17 thường nổi bật với thiết kế viền mỏng tinh tế, mặt trước Ceramic Shield 2 và màn hình Super Retina XDR 6.3 inch hỗ trợ ProMotion 120Hz. Máy được trang bị chip A19 với CPU 6 nhân và GPU 5 lõi, mang lại khả năng xử lý nhanh chóng các tác vụ nặng, từ giải trí đến làm việc. Ngoài ra, iPhone 17 còn được hỗ trợ Apple Intelligence, hỗ trợ các tác vụ thông thường thông minh, tiện lợi.	https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/i/p/iphone_17_256gb-3_2.jpg	2025-11-19 16:05:37.855046	\N	100
3	Samsung Galaxy S25 Ultra 12GB 256GB	1100	\N	Samsung Galaxy S25 Ultra mạnh mẽ với chip Snapdragon 8 Elite For Galaxy mới nhất, RAM 12GB và bộ nhớ trong 256GB-1TB. Hệ thống 3 camera sau chất lượng gồm camera chính 200MP, camera tele 50MP và camera góc siêu rộng 50MP. Thiết kế kính cường lực Corning Gorilla Armor 2 và khung viền Titanium, màn hình Dynamic AMOLED 6.9 inch. Điện thoại này còn có viên pin 5000mAh, hỗ trợ 5G và Galaxy AI ấn tượng, nâng cao trải nghiệm người dùng!	https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/d/i/dien-thoai-samsung-galaxy-s25-ultra_1__3.png	2025-11-19 16:08:38.180023	\N	10
11	Nubia Neo 3 GT 12GB 256GB	260	\N	Điện thoại nubia Neo 3 GT 5G sử dụng chip Unisoc T9100 6nm 5G, xung nhịp lên đến 2.7GHz, pin khủng 6000mAh kèm theo RAM dung lượng 12GB và bộ nhớ trong 256GB. Mẫu điện thoại nubia này còn trang bị màn hình OLED 120Hz với độ sáng 1300 nits. Ngoài ra, thiết kế kiểu Cyber-Mecha cùng kiểu dáng đậm chất gaming cũng thích hợp cho nhiều đối tượng.	https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/d/i/dien-thoai-nubia-neo-3-gt-12gb-256gb_5_.png	2025-11-19 16:19:36.794811	\N	100
4	Samsung Galaxy Z Fold7 5G 12GB 256GB	1650	\N	Samsung Galaxy Z Fold 7 mở ra một kỷ nguyên mới cho điện thoại gập khi kết hợp hoàn hảo giữa kiểu dáng mỏng nhẹ, phần cứng mạnh mẽ và trí tuệ nhân tạo thông minh. Với diện mạo đẳng cấp cùng màn hình gập 8 inch siêu lớn, đây là thiết bị dành cho người dùng yêu cầu sự khác biệt và đột phá về trải nghiệm.	https://cdn2.fptshop.com.vn/unsafe/750x0/filters:format(webp):quality(75)/samsung_galaxy_z_fold7_xam_1_de1fb8f431.png	2025-11-19 16:10:24.691318	\N	100
5	Samsung Galaxy S25 5G 12GB 256GB	700	\N	Samsung Galaxy S25 là siêu phẩm cao cấp với thiết kế nhỏ gọn và hiệu năng vượt trội bởi Snapdragon 8 Elite for Galaxy tiến trình 3nm đầu tiên. Kết hợp đó là sức mạnh AI tiên tiến, giúp người dùng có những trải nghiệm công nghệ hiện đại và tiện lợi hơn.	https://cdn2.fptshop.com.vn/unsafe/750x0/filters:format(webp):quality(75)/galaxy_s25_silver_1_c0686832fc.png	2025-11-19 16:13:02.972895	\N	100
7	Samsung Galaxy A56 5G 8GB 128GB	376	\N	Samsung Galaxy A56 5G thuyết phục người dùng với bộ công cụ AI mạnh mẽ, tích hợp nhiều tính năng hiện đại, dễ sử dụng, cùng hiệu năng vượt trội từ vi xử lý Exynos 1580. Ngoài ra, thiết bị còn được hỗ trợ cập nhật phần mềm lên đến 6 năm, mang lại trải nghiệm ổn định và lâu dài, giúp người dùng yên tâm sử dụng.	https://cdn2.fptshop.com.vn/unsafe/750x0/filters:format(webp):quality(75)/samssung_galaxy_a56_den_2_6e193f203b.jpg	2025-11-19 16:16:18.489203	\N	20
8	Samsung Galaxy A07 4GB 128GB	150	\N	Galaxy A07 cho trải nghiệm ấn tượng với thiết kế mỏng chỉ 7.6mm, màn hình lớn 6.7 inch mượt mà nhờ tần số quét 90Hz. Hiệu năng MediaTek Helio G99 đáp ứng tốt nhu cầu học tập, giải trí và sử dụng thường ngày. Thiết bị được cài sẵn One UI 7 hiện đại và được cam kết hỗ trợ cập nhật hệ điều hành, bảo mật trong suốt 6 năm, đảm bảo an tâm trong quá trình sử dụng lâu dài.	https://cdn2.fptshop.com.vn/unsafe/750x0/filters:format(webp):quality(75)/samsung_galaxy_a07_den_8f3ec76cb0.png	2025-11-19 16:17:21.335285	\N	100
10	Infinix Note 50 Pro 12GB 256GB	250	\N	Điện thoại Infinix Note 50 Pro sở hữu màn hình AMOLED 6.78 inch hiện đại, tần số quét lên đến 144Hz, cho trải nghiệm hiển thị mượt mà và sống động. Bộ vi xử lý MediaTek Helio G100 Ultimate tiến trình 6nm kết hợp RAM 12GB (có thể mở rộng lên 24GB thông qua bộ nhớ ảo), mang đến khả năng đa nhiệm mượt mà. Ngoài ra, camera chính 50MP của điện thoại Infinix này còn hỗ trợ OIS và AI RAW, cho khả năng chụp đêm rõ nét.	https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/d/i/dien-thoai-infinix-note-50-pro_5_.png	2025-11-19 16:18:27.469782	\N	100
9	Samsung Galaxy A17 8GB 128GB	190	\N	Galaxy A17 là lựa chọn lý tưởng cho người dùng trẻ đang tìm kiếm một điện thoại hiện đại, dễ sử dụng và có mức giá hợp lý. Thiết kế mỏng nhẹ giúp cầm nắm thoải mái, kết hợp màn hình lớn 6.7 inch tối ưu cho học tập, giải trí và kết nối hằng ngày. Camera chính 50MP OIS cho hình ảnh sắc nét, chi tiết, hỗ trợ chụp ảnh và quay video chất lượng cao dễ dàng.	https://cdn2.fptshop.com.vn/unsafe/750x0/filters:format(webp):quality(75)/samsung_galaxy_a17_xam_f03849419f.png	2025-11-19 16:18:23.675078	\N	20
2	Nubia A76 4GB 128GB (NFC)	97	\N	Nubia A76 NFC được định vị là sản phẩm hướng đến nhóm người dùng phổ thông, đặc biệt là những ai tìm kiếm một chiếc điện thoại kết hợp hoàn hảo giữa thiết kế phong cách flagship, camera AI 50MP chuyên nghiệp và trải nghiệm Android 15 với Google Gemini tích hợp.	https://cdn2.fptshop.com.vn/unsafe/1920x0/filters:format(webp):quality(75)/nubia_a76_1_2934ce8dbb.jpg	2025-11-19 16:08:14.409952	\N	20
12	Samsung Galaxy A06 5G 4GB 128GB	150	\N	Galaxy A06 5G là phiên bản nâng cấp với kết nối 5G, giúp bạn truy cập Internet, tải dữ liệu và phát trực tuyến nhanh chóng, ổn định hơn so với phiên bản 4G. Đồng hành cùng đó là vi xử lý MediaTek Dimensity 6300 tăng cường hiệu năng cho mọi thao tác diễn ra mượt mà, đáp ứng tốt nhu cầu học tập, giải trí của người dùng.	https://cdn2.fptshop.com.vn/unsafe/750x0/filters:format(webp):quality(75)/samsung_galaxy_a06_5g_den_129610b5f2.png	2025-11-19 16:20:18.978581	\N	20
13	Samsung Galaxy A16 4GB 128GB	140	\N	Trong tầm giá rẻ, Galaxy A16 4G là lựa chọn lý tưởng cho Gen Z năng động với thiết kế trẻ trung, sắc màu cá tính, hiện đại. Điểm ấn tượng của chiếc smartphone này còn là tính bền bỉ, sử dụng dài lâu bởi hỗ trợ 6 bản cập nhật lớn và kháng nước IP54.	https://cdn2.fptshop.com.vn/unsafe/750x0/filters:format(webp):quality(75)/samsung_galaxy_a16_den_d67f4904a5.jpg	2025-11-19 16:21:59.69541	\N	12
14	Samsung Galaxy S25 FE 5G 8GB 128GB	530	\N	Samsung Galaxy S25 FE mang trải nghiệm công nghệ cao cấp đến gần hơn với bạn. Máy sở hữu thiết kế mỏng nhẹ, tinh tế cùng công nghệ hiện đại, kết hợp hiệu năng mạnh mẽ từ chip Exynos 2400 và tính năng AI thông minh. Pin 4.900mAh cho phép bạn tận hưởng mọi tác vụ, từ làm việc đến giải trí, suốt cả ngày mà không gián đoạn.	https://cdn2.fptshop.com.vn/unsafe/750x0/filters:format(webp):quality(75)/samsung_galaxy_s25_fe_xanh_1_c009142276.png	2025-11-19 16:23:33.607542	\N	20
15	Samsung Galaxy A07 8GB 256GB	170	\N	Galaxy A07 là lựa chọn nổi bật trong phân khúc tầm trung với nhiều ưu điểm sáng giá. Điện thoại sở hữu màn hình lớn mượt mà, camera 50MP, chip Helio G99, chạy One UI 7 và được hỗ trợ cập nhật phần mềm trong 6 năm, tạo sự an tâm cho quá trình sử dụng lâu dài. Đặc biệt, phiên bản Galaxy A07 8GB 256GB giúp người dùng đa nhiệm mượt hơn và lưu trữ dữ liệu thoải mái cho học tập, công việc lẫn giải trí.	https://cdn2.fptshop.com.vn/unsafe/750x0/filters:format(webp):quality(75)/samsung_galaxy_a07_den_8f3ec76cb0.png	2025-11-19 16:25:16.47246	\N	30
16	Samsung Galaxy A17 5G 8GB 128GB	190	\N	Sở hữu thiết kế thanh lịch và hiệu năng ổn định, Galaxy A17 5G là người bạn đồng hành lý tưởng cho những ai cần một chiếc smartphone bền bỉ trong công việc lẫn giải trí hàng ngày. Thiết bị nổi bật với màn hình Super AMOLED 6.7 inch sống động, vi xử lý Exynos 1330 mạnh mẽ cùng kết nối 5G tốc độ cao, mang đến trải nghiệm mượt mà và liền mạch cho người dùng.	https://cdn2.fptshop.com.vn/unsafe/750x0/filters:format(webp):quality(75)/samsung_galaxy_a17_5g_den_ddcf912146.png	2025-11-19 16:26:12.159485	\N	10
17	Samsung Galaxy S24 Ultra 5G 256GB	800	\N	Samsung Galaxy S24 Ultra là chiếc điện thoại Galaxy thông minh nhất từ trước đến nay với quyền năng kết nối, quyền năng sáng tạo và quyền năng giải trí đều được hỗ trợ bởi trí tuệ nhân tạo Galaxy AI. Thiết kế hoàn toàn mới từ bộ khung Titan đẳng cấp, siêu camera độ phân giải lên tới 200MP và bộ vi xử lý Snapdragon 8 Gen 3 for Galaxy sẽ mang đến trải nghiệm thú vị chưa từng có dành cho bạn.	https://cdn2.fptshop.com.vn/unsafe/750x0/filters:format(webp):quality(75)/2024_1_15_638409395341919374_samsung-galaxy-s24-ultra-den-1.png	2025-11-19 16:27:03.293753	\N	10
18	Samsung Galaxy A16 5G 8GB 128GB	300	\N	Được trang bị những tính năng nổi bật, Samsung Galaxy A16 5G mang tới những trải nghiệm công nghệ sáng giá trong phân khúc như màn hình lớn 6.7 inch Super AMOLED sắc nét, hiệu năng mượt mà. Đặc biệt đây cũng là thế hệ Galaxy A đầu tiên hỗ trợ đến 6 năm cập nhật phần mềm, đảm bảo sử dụng dài lâu cho người dùng.	https://cdn2.fptshop.com.vn/unsafe/750x0/filters:format(webp):quality(75)/samsung_galaxy_a16_5g_xanh_0231fa3013.jpg	2025-11-19 16:28:06.51574	\N	20
19	Samsung Galaxy M55 5G 256GB	300	\N	Không chỉ sở hữu kiểu dáng thanh lịch với ngôn ngữ thiết kế trẻ trung, Samsung Galaxy M55 còn ghi điểm nhờ chip xử lý lõi tám mạnh mẽ, camera 50MP chống rung quang học OIS và hỗ trợ sạc siêu nhanh 45W tốc độ cao. Đây là lựa chọn lý tưởng cho những ai kiếm tìm trải nghiệm cao cấp trên một thiết bị có giá bán không quá cao.	https://cdn2.fptshop.com.vn/unsafe/750x0/filters:format(webp):quality(75)/samsung_galaxy_m55_den_4_d7f9674500.jpg	2025-11-19 16:29:11.052356	\N	50
20	Samsung Galaxy A26 5G 8GB 128GB	250	\N	Samsung Galaxy A26 5G đánh dấu bước chuyển mình mạnh mẽ so với tiền nhiệm cùng bộ tính năng AI thông minh, tiện lợi và chuẩn kháng bụi nước IP67 cao cấp. Đồng hành đó là cam kết nhận 6 năm cập nhật phần mềm và bảo mật, giúp người dùng yên tâm sử dụng dài lâu, luôn được trải nghiệm những tính năng mới nhất với hiệu suất ổn định.	https://cdn2.fptshop.com.vn/unsafe/750x0/filters:format(webp):quality(75)/samsung_galaxy_a26_5g_den_6f17cec504.png	2025-11-19 16:29:56.796819	\N	50
6	Samsung Galaxy A36 5G 8GB 128GB	300	\N	Samsung Galaxy A36 5G sẽ khiến bạn bất ngờ với thiết kế mỏng gọn hiện đại, pin lớn và những tính năng AI tiện lợi, giúp người dùng tận hưởng công nghệ thông minh một cách dễ dàng. Đây là một trong những dòng Galaxy giá phải chăng đầu tiên được tích hợp AI, mang lại hiệu suất tối ưu và hỗ trợ các tác vụ hằng ngày hiệu quả hơn.	https://cdn2.fptshop.com.vn/unsafe/750x0/filters:format(webp):quality(75)/samssung_galaxy_a36_den_4d1a971013.jpg	2025-11-19 16:14:10.161138	\N	5
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, password, role, created_at) FROM stdin;
2	Na	na@gmail.com	$2a$10$uY7.jFbpwCLA/F125iVx6.BH41J7R6m2B05M6In81FLqv6kKvA2Py	user	2025-11-19 15:56:22.362349
3	duongle	duong123@gmail.com	$2a$10$04VfjQj5Ih0sug9NA/JcIOR8mo8DntwpCT.EOaD.zk6IbRpMshkJW	user	2025-11-19 16:03:22.007729
1	Admin	admin@example.com	$2a$10$UQxm2IpTQbCA7/u3R.fMOuHkbs5GkE.f3uKdtjqVl24m9G4cJpgUa	admin	2025-11-19 15:31:53.328446
4	Duong	123@gmail.com	$2a$10$Ee5w4pjF3/TpKNrhDXo4C.x4D0RU2aNpDcXqkepYz7Js5FC276Zxu	user	2025-11-26 08:37:35.643971
\.


--
-- Name: addresses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.addresses_id_seq', 1, true);


--
-- Name: banners_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.banners_id_seq', 3, true);


--
-- Name: cart_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cart_id_seq', 2, true);


--
-- Name: cart_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cart_items_id_seq', 2, true);


--
-- Name: order_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.order_items_id_seq', 1, false);


--
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.orders_id_seq', 1, false);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.products_id_seq', 20, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 4, true);


--
-- Name: addresses addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_pkey PRIMARY KEY (id);


--
-- Name: banners banners_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.banners
    ADD CONSTRAINT banners_pkey PRIMARY KEY (id);


--
-- Name: cart_items cart_items_cart_id_product_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_cart_id_product_id_key UNIQUE (cart_id, product_id);


--
-- Name: cart_items cart_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);


--
-- Name: cart cart_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart
    ADD CONSTRAINT cart_pkey PRIMARY KEY (id);


--
-- Name: cart cart_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart
    ADD CONSTRAINT cart_user_id_key UNIQUE (user_id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_addresses_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_addresses_user ON public.addresses USING btree (user_id);


--
-- Name: addresses addresses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: cart_items cart_items_cart_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_cart_id_fkey FOREIGN KEY (cart_id) REFERENCES public.cart(id) ON DELETE CASCADE;


--
-- Name: cart_items cart_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: cart cart_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart
    ADD CONSTRAINT cart_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: orders orders_address_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_address_id_fkey FOREIGN KEY (address_id) REFERENCES public.addresses(id);


--
-- Name: orders orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict CopGHjJL3t60n19SzQd6qhwOG1eSC2OnyeW9nbRfTQD7pdaguKFe6Dtkp4zy5rk

