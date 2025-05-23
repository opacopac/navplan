-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: navplan_persistence
-- Erstellungszeit: 01. Mai 2025 um 11:50
-- Server-Version: 10.6.21-MariaDB-ubu2004
-- PHP-Version: 8.2.28

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Datenbank: `tschanz_navplan`
--
use `tschanz_navplan`;

--
-- Daten für Tabelle `webcams`
--

INSERT INTO `webcams` (`id`, `name`, `url`, `latitude`, `longitude`, `airport_icao`) VALUES
(1, 'Roggenberg', 'http://roggenberg.roundshot.com/', 47.305, 7.7186, NULL),
(2, 'Webcam', 'http://birrfeld.roundshot.com/', 47.4439, 8.2297, 'LSZF'),
(3, 'Bönzingenberg', 'http://boezingenberg.roundshot.com/', 47.1717, 7.28389, NULL),
(4, 'Webcam', 'http://fliegen.roundshot.com/', 47.1831, 7.4137, 'LSZG'),
(5, 'Schilthorn - Birg', 'http://schilthorn.roundshot.com/birg/', 46.5617, 7.8573, NULL),
(6, 'Gemmipass', 'http://gemmi.roundshot.com/', 46.3975, 7.61556, NULL),
(8, 'La Côte', 'http://nyon-tourisme.roundshot.com/', 46.3806, 6.24111, NULL),
(9, 'Musée Suisse de l\'appareil photographique', 'http://msap.roundshot.com/', 46.4592, 6.84278, NULL),
(10, 'Chaumont', 'http://chaumont.roundshot.com/', 47.0258, 6.95806, NULL),
(11, 'Glacier3000', 'http://glacier3000.roundshot.com/', 46.3267, 7.20361, NULL),
(12, 'Alpen-Tower', 'http://alpentower.roundshot.com/', 46.7367, 8.255, NULL),
(13, 'Pilatus Kulm Esel', 'http://pilatus.roundshot.com/', 46.9792, 8.25611, NULL),
(14, 'La Chaux-de-Fonds', 'http://lachauxdefonds.roundshot.com/', 47.1022, 6.82861, NULL),
(15, 'Porrentruy', 'http://juratourisme.roundshot.com/porrentruy/', 47.4108, 7.07583, NULL),
(16, 'Webcams', 'https://aerojura.ch/#webcam', 0, 0, 'LSZQ'),
(17, 'Webcam', 'https://fgho.roundshot.com/', 0, 0, 'LSZN'),
(18, 'Webcam', 'https://bernairport.roundshot.com/', 0, 0, 'LSZB'),
(20, 'Webcams', 'http://aecs.lspl.ch/index.php?id=33', 0, 0, 'LSPL'),
(21, 'Webcam Nord', 'http://www.lausanne-airport.ch/webcam0/wopen.html', 0, 0, 'LSGL'),
(22, 'Webcam Sud', 'http://lausanne-airport.ch/webcam2/wopen.html', 0, 0, 'LSGL'),
(24, 'Weissenboden', 'http://bielkinzig.roundshot.com/weissenboden/', 46.8997, 8.70917, NULL),
(25, 'Wildspitz', 'http://wildspitz.roundshot.com/', 47.0844, 8.57722, NULL),
(26, 'Rotenflue', 'http://kachelmannwetter.roundshot.com/rotenflue/', 47.0211, 8.70306, NULL),
(27, 'Chäserrugg', 'http://chaeserrugg.roundshot.com/', 47.1547, 9.31306, NULL),
(28, 'Rorschacherberg', 'http://computechnic.roundshot.com/', 47.4744, 9.50806, NULL),
(29, 'Bendern', 'http://fotoprocolora.roundshot.com/', 47.2056, 9.50222, NULL),
(30, 'Parpaner Rothorn', 'http://lenzerheide.roundshot.com/rothorn/', 46.7425, 9.59722, NULL),
(31, 'Webcam', 'https://gstaad-airport.roundshot.com/', 0, 0, 'LSGK'),
(32, 'Inselspital', 'http://www.insel.ch/fileadmin/inselspital/users/ueber_das_Inselspital/Webcam/inselbhhs1/insel_bhh_s1.jpg', 46.9476, 7.4252, 'XXXX'),
(33, 'Webcam', 'https://lsgy.ch/webcams/webcam.php?id=1', 0, 0, 'LSGY'),
(34, 'Webcam W', 'https://www.flyingranch.ch/2020cam/index.php', 0, 0, 'LSPN'),
(35, 'Hotel Gstaad Palace', 'http://palacegstaad.roundshot.com/', 46.4728, 7.28917, NULL),
(36, 'Leysin - La Berneuse', 'http://tlml.roundshot.com/', 46.3597, 7.00194, NULL),
(37, 'Caboulis', 'http://www.caboulis.ch/french/webcam.htm', 46.1932, 7.3461, 'XXXX'),
(39, 'UTO KULM', 'http://uetliberg.roundshot.com/', 47.3494, 8.49139, NULL),
(40, 'Mont Gibloux', 'https://montgibloux.roundshot.com/', 46.6839, 7.04, NULL),
(42, 'Webcams', 'https://www.flpz-cam.ch/wangen/', 0, 0, 'LSPV'),
(44, 'Webcam RWY 17', 'https://www.aerodrome-gruyere.ch/webcam/LSGT-17.jpg', 0, 0, 'LSGT'),
(45, 'GZO Spital Wetzikon', 'http://gzo.roundshot.com/', 47.3211, 8.8025, NULL),
(46, 'GA Weissenstein', 'https://ga-weissenstein.roundshot.com/weissenstein/', 47.2517, 7.50861, NULL),
(47, 'Murten - Morat', 'http://morat.roundshot.com/', 46.9281, 7.115, NULL),
(48, 'Webcam', 'https://lszr.roundshot.com/#/', 0, 0, 'LSZR'),
(49, 'Webcam E', 'http://webcam.mfgt.ch/eh.jpg', 0, 0, 'LSZT'),
(50, 'Webcam', 'https://engadin-airport.roundshot.com/', 0, 0, 'LSZS'),
(52, 'Geneva', 'http://geneva.roundshot.com/', 46.2036, 6.15694, 'XXXX'),
(53, 'Jungfraujoch', 'https://jungfrau.roundshot.com/top-of-europe-jungfraujoch/', 46.5474, 7.9809, NULL),
(54, 'RSI Catto', 'http://mediaww.rsi.ch/meteo/webcam/img/CT.jpg', 46.5047, 8.7363, NULL),
(55, 'Cardada - Cimetta', 'http://webtv.feratel.com/webtv/?cam=4225&t=9&design=v3&c0=0&lg=de&s=0', 46.2008, 8.791, NULL),
(57, 'Webcam Est', 'http://www.leseplaturesairport.ch/site/images/stories/webcam/LSGC1.jpg', 0, 0, 'LSGC'),
(58, 'Webcam Ouest', 'http://www.leseplaturesairport.ch/site/images/stories/webcam/LSGC3.jpg', 0, 0, 'LSGC'),
(59, 'Webcams', 'http://www.neuchatel-airport.ch/v2/infos-generales/webcam/', 0, 0, 'LSGN'),
(60, 'Webcam', 'http://www.aeroclub-lacote.ch/index.php/briefing-pilotes/aerodrome-la-cote/webcams', 0, 0, 'LSGP'),
(61, 'Grimsel Hospiz', 'https://grimselwelt.roundshot.com/hospiz/#/', 46.5714, 8.33122, NULL),
(62, 'Tanatzhöhi', 'https://spluegen.roundshot.com/', 46.5306, 9.31361, NULL),
(63, 'Webcam SE', 'https://www.flugschule-eichenberger.ch/webcam/east.jpg', 0, 0, 'LSZU'),
(64, 'Haldigrat', 'http://bill-online.net/haldigrat_west.jpg', 46.9031, 8.4403, NULL),
(66, 'Webcam Klausenpasshöhe', 'https://www.hotel-klausenpass.ch/webcam/', 46.8724, 8.8372, NULL),
(67, 'Luzerner Höhenklinik Montana', 'http://lhm.roundshot.com/', 46.3167, 7.49806, NULL),
(68, 'Gemeinde Stalden', 'http://gemeindestalden.roundshot.com/', 46.2294, 7.87028, NULL),
(69, 'Wiler Turm', 'http://wilerturm.roundshot.com/', 47.4786, 9.04944, NULL),
(70, 'Heim Meiengarten', 'http://maiengarten.roundshot.com/', 47.5233, 8.83833, NULL),
(71, 'Livecam Heiden', 'http://heiden.roundshot.com/', 47.4406, 9.53889, NULL),
(72, 'El Paradiso - St. Moritz', 'http://elparadiso.roundshot.com/', 46.4894, 9.80806, NULL),
(73, 'Sils im Engadin', 'http://sils.roundshot.com/', 46.4294, 9.76111, NULL),
(74, 'Belvedere Hotels Scuol', 'http://belvedere.roundshot.com/', 46.7972, 10.2975, NULL),
(75, 'Crap Masegn', 'http://laax.roundshot.com/crap-masegn/', 46.8422, 9.18, NULL),
(77, 'Parsenn Weissfluhjoch', 'https://www.davosklostersmountains.ch/de/mountains/sommer/live-info/webcams?mountain=1234', 46.8329, 9.8058, NULL),
(78, 'Livecam Bürgenstock Resort', 'http://buergenstock.roundshot.com/', 46.9967, 8.38, NULL),
(79, 'Valleé de Joux', 'http://valleedejoux.roundshot.com/', 46.6611, 6.33667, NULL),
(80, 'Livecam', 'http://www.acvt.ch/index.php/ad-info/livecam', 0, 0, 'LSTO'),
(81, 'Webcam SW', 'http://www.gliding.ch/cameras/camera1/image_01.jpg', 0, 0, 'LSTR'),
(82, 'Webcam NW', 'http://www.gliding.ch/cameras/camera2/image_01.jpg', 0, 0, 'LSTR'),
(83, 'Tête de Ran', 'http://tete-de-ran.roundshot.com/', 47.0542, 6.85361, NULL),
(84, 'Webcam', 'https://lszj.ch/fr/flugplatz/webcams/', 0, 0, 'LSZJ'),
(85, 'Webcams', 'http://www.michael-frey.ch/webcamlszx.php', 0, 0, 'LSZX'),
(86, 'Webcams', 'http://new.lsze.ch/index.php', 0, 0, 'LSZE'),
(92, 'Livecam S', 'https://www.hegnet.ch/webcam/flugplatz_mollis_sued.jpg', 0, 0, 'LSZM'),
(93, 'Webcam Guggisberg', 'http://www.webcam-guggisberg.ch/webcam/webcam.jpg', 46.7655, 7.3413, NULL),
(95, 'Säntis', 'https://saentis.roundshot.com/', 47.2494, 9.3424, NULL),
(96, 'Gasthaus Rossberg', 'https://webcam.rossbergschindellegi.ch/incoming/Webcamaktuell/', 47.1711, 8.6932, NULL),
(97, 'Livecam Zugerberg', 'https://www.wwz.ch/ueber-uns/webcam.html', 47.1456, 8.5414, NULL),
(98, 'Bergstation Wasserfallen', 'http://wasserfallenbahn.roundshot.com/', 47.3736, 7.69972, NULL),
(99, 'Livecam', 'https://flugplatzschupfart.roundshot.com/', 0, 0, 'LSZI'),
(100, 'Webcams', 'https://sg-dittingen.ch/d/index.php/de/ppr/webcam', 0, 0, 'LSPD'),
(101, 'Piz Scalottas', 'http://lenzerheide.roundshot.com/pizscalottas/', 46.7217, 9.51111, NULL),
(102, 'Sörenberg / Brienzer Rothorn', 'http://webtv.feratel.com/webtv/?design=v3&cam=24095', 46.7872, 8.0444, 'XXXX'),
(103, 'Webcam Mont-Fort', 'https://verbier.roundshot.com/montfort/#/', 46.08, 7.31827, NULL),
(104, 'Gornergrat', 'https://gornergrat.roundshot.com/#/', 45.9838, 7.78304, NULL),
(105, 'Uni Bern, Klima und Umweltphysik', 'http://climateold.unibe.ch/wwwnew/webcam/higher.jpg', 46.9512, 7.43893, 'XXXX'),
(106, 'Bern - Bellevue Palace', 'https://berntourismus.roundshot.com/hotelbellevuepalace/', 46.9464, 7.4469, NULL),
(107, 'Wolhusen - Luzerner Kantonsspital', 'https://luks-wolhusen.roundshot.com/', 47.0664, 8.0744, NULL),
(108, 'Sursee - Luzerner Kantonsspital', 'https://luks-sursee.roundshot.com/', 47.1681, 8.1175, NULL),
(109, 'Lenzburg - SWL Energie AG', 'https://swl.roundshot.com/', 47.3944, 8.1681, NULL),
(110, 'Pas-de-Maimbré', 'https://anzere.roundshot.com/pistes/', 46.3124, 7.3859, NULL),
(111, 'Verbier - Le Carrefour', 'https://lecarrefour.roundshot.com/', 46.1017, 7.2417, NULL),
(112, 'Petit Chamossaire', 'https://villars.roundshot.com/pt-chamossaire/', 46.3314, 7.0669, NULL),
(113, 'Gruyère Tourisme', 'https://lagruyere.roundshot.com/', 46.5842, 7.0819, NULL),
(114, 'Montmagny', 'https://montmagny.roundshot.com/', 46.9268, 7.0094, NULL),
(115, 'Livecam Männlichenbahn', 'https://www.maennlichen.ch/en/live.html', 46.611, 7.9427, NULL),
(116, 'Portes du Soleil - Pointe des Mossettes', 'https://portesdusoleil.roundshot.com/', 46.1906, 6.8161, NULL),
(117, 'Tête de Véret', 'https://grandmassif.roundshot.com/flaineveret/', 46.0099, 6.71356, NULL),
(118, 'Gynmasium Bäumlihof', 'https://baeumlihof.roundshot.com/', 47.5675, 7.6264, NULL),
(119, 'Berghaus Gumen', 'https://braunwald.roundshot.com/gumen/', 46.9562, 8.98504, NULL),
(120, 'Fürenalp', 'https://fuerenalp.roundshot.com/', 46.8008, 8.4678, NULL),
(122, 'Bonistock', 'https://bonistock.roundshot.com/', 46.7775, 8.2897, NULL),
(123, 'Stans - Kantonsspital Nidwalden', 'https://ksnw.roundshot.com/', 46.96, 8.3572, NULL),
(124, 'Télé Château-d\'Oeux', 'https://telechateaudoex.roundshot.com/la-braye/', 46.4472, 7.145, NULL),
(125, 'HUUS Gstaad', 'https://huusgstaad.roundshot.com/', 46.4931, 7.2669, NULL),
(126, 'Lac des Taillères', 'https://tailleres.roundshot.com/', 46.9708, 6.5861, NULL),
(127, 'Les Brenets', 'https://lesbrenets.roundshot.com/', 47.0683, 6.6975, NULL),
(128, 'Saignelégier', 'https://juratourisme.roundshot.com/saignelegier/', 47.2536, 6.9983, NULL),
(129, 'Delémont', 'https://juratourisme.roundshot.com/delemont/', 47.3619, 7.3497, NULL),
(130, 'Niesen', 'http://www.niview.ch/', 46.6462, 7.6524, NULL),
(131, 'Webcam RWY 35', 'https://www.aerodrome-gruyere.ch/webcam/LSGT-35.jpg', 0, 0, 'LSGT'),
(132, 'Webcam E', 'http://84.253.28.12/axis-cgi/jpg/image.cgi?resolution=1920x1080', 0, 0, 'LSZP'),
(135, 'Kamera West', 'http://sg-freiburg.ch/wx/webcam/rwy08.jpg', 0, 0, 'LSTB'),
(136, 'Panorama-Kamera', 'http://www.sg-freiburg.ch/wx/webcam/current180.jpg', 0, 0, 'LSTB'),
(137, 'Kamera Ost', 'http://sg-freiburg.ch/wx/webcam/rwy26.jpg', 0, 0, 'LSTB'),
(138, 'Webcam RWY 27', 'http://www.aerodrome-ecuvillens.ch/webcam/webcam_rwy27.jpg', 0, 0, 'LSGE'),
(139, 'Webcam RWY 09', 'http://www.aerodrome-ecuvillens.ch/webcam/webcam_rwy09.jpg', 0, 0, 'LSGE'),
(140, 'Webcam', 'http://www.thun-airfield.ch/piloten/webcam/', 0, 0, 'LSZW'),
(142, 'Aroser Weisshorn', 'https://weisshorn.roundshot.com/', 46.7889, 9.6372, NULL),
(143, 'Turren, Richtung Brünig', 'https://turren.ch/webcam/cam2/cam2_aktuell.jpg', 46.7895, 8.1308, NULL),
(144, 'Webcams', 'http://www.airportlspg.ch/index.php/webcams-kaegiswil', 0, 0, 'LSPG'),
(145, 'Webcams Sustenpass', 'https://sustenpass.ch/de/Info/Livecam', 46.7292, 8.4491, NULL),
(146, 'Webcams', 'https://www.zweisimmen.aero/pilots-only/', 0, 0, 'LSTZ'),
(147, 'Webcam', 'http://www.p-c-a.ch/webcam.html', 0, 0, 'LSTS'),
(148, 'Sillerenbühl', 'http://webtv.feratel.com/webtv/?cam=4107&t=9&design=v3&c0=0&lg=de&s=0', 46.471, 7.518, NULL),
(149, 'Metschstand', 'http://webtv.feratel.com/webtv/?cam=4230&t=9&design=v3&c0=0&lg=de&s=0', 46.445, 7.4954, NULL),
(150, 'Livecam SW', 'http://fluggruppe-reichenbach.dyndns.org:8082/view/viewer_index.shtml?id=4246', 0, 0, 'LSGR'),
(152, 'Bantiger', 'https://bantiger.roundshot.com/', 46.9775, 7.529, NULL),
(153, 'Sörenberg / Brienzer Rothorn', 'https://soerenberg.roundshot.co/rothorn/', 46.7872, 8.0444, NULL),
(154, 'Gemsstock', 'https://andermatt-sedrun.roundshot.com/gemsstock/', 46.6022, 8.6117, NULL),
(155, 'Les Rasses', 'https://yverdon.roundshot.com/lesrasses/', 46.8428, 6.5289, NULL),
(156, 'Livecam EPFL', 'https://epfl.roundshot.com/', 46.5183, 6.5617, NULL),
(157, 'Hoher Kasten - LiveCam', 'https://www.hoherkasten.ch/informieren/webcam-wetter/', 47.2834, 9.48527, NULL),
(158, 'Webcams', 'http://city-flugplatz-freiburg.de/de/webcams_live.php', 0, 0, 'EDTF'),
(159, 'St. Chrischona', 'https://chrischona.roundshot.com/', 47.5717, 7.687, NULL),
(160, 'Niederhorn', 'https://niederhornbahn.roundshot.com/', 46.7106, 7.775, NULL),
(161, 'Webcam', 'https://sionairport.roundshot.com/', 0, 0, 'LSGS'),
(162, 'Schauenberg', 'https://schauenberg.roundshot.com/', 47.46, 8.86639, NULL),
(163, 'Wasserturm Baldegg', 'https://baden.roundshot.com/turm-baldegg/', 47.47, 8.2825, NULL),
(164, 'Brambrüesch', 'https://brambruesch.roundshot.com/', 46.8122, 9.50278, NULL),
(165, 'Kloster Disentis', 'https://klosterdisentis.roundshot.com/', 46.6875, 8.84722, NULL),
(166, 'Marbachegg', 'https://marbachegg.roundshot.com/', 46.835, 7.90611, NULL),
(167, 'Hohbiel', 'https://belalp.roundshot.com/hohbiel/', 46.3967, 7.97694, NULL),
(168, 'Schynige Platte', 'https://jungfrau.roundshot.com/schynige-platte/', 46.6508, 7.90917, NULL),
(169, 'Chasseral', 'https://chasseral.roundshot.com/', 47.1331, 7.06028, NULL),
(170, 'Valzeina', 'https://valzeina.roundshot.com/', 46.9458, 9.59417, NULL),
(171, 'San Salvatore', 'https://sansalvatore.roundshot.com/', 45.9772, 8.94667, NULL),
(172, 'Rigi Scheidegg', 'https://feed.yellow.camera/rigi-scheidegg', 47.0275, 8.52, NULL),
(173, 'Hagenturm', 'https://hagenturm.roundshot.com/', 47.7739, 8.5675, NULL),
(174, 'Rochers de Naye', 'https://mob.roundshot.com/rochersdenaye/', 46.4317, 6.97611, NULL),
(175, 'Capanna Gorda', 'https://capannagorda.roundshot.com/', 46.4978, 8.91083, NULL),
(176, 'Schwarzsee', 'https://schwarzseetourismus.roundshot.com/', 46.6739, 7.28278, NULL),
(177, 'La Berra', 'https://laberra.roundshot.com/', 46.6775, 7.17861, NULL),
(178, 'Webcam', 'https://erlebnisflugplatz.roundshot.com/', 0, 0, 'LSZV'),
(179, 'Livecam N', 'http://fluggruppe-reichenbach.dyndns.org:8081/view/viewer_index.shtml?id=7143', 0, 0, 'LSGR'),
(180, 'Webcam W', 'http://webcam.mfgt.ch/wh.jpg', 0, 0, 'LSZT'),
(181, 'Rigi', 'https://rigi.roundshot.com/', 47.0564, 8.485, NULL),
(182, 'Webcam SE', 'https://www.flyingranch.ch/2020cam/index_PARKPLATZ.php', 0, 0, 'LSPN'),
(183, 'Webcam N', 'https://www.flugschule-eichenberger.ch/webcam/NewCamNord.jpg', 0, 0, 'LSZU'),
(184, 'Webcams', 'https://www.flubag.ch/de/webcams', 0, 0, 'LSZO'),
(185, 'Webcam SW', 'http://84.253.28.13/axis-cgi/jpg/image.cgi?resolution=1920x1080', 0, 0, 'LSZP'),
(186, 'Webcam NW', 'http://84.253.28.14/axis-cgi/jpg/image.cgi?resolution=1920x1080', 0, 0, 'LSZP'),
(187, 'Livecam N', 'https://www.hegnet.ch/webcam/flugplatz_mollis_nord.jpg', 0, 0, 'LSZM'),
(188, 'Webcam', 'https://buochs.roundshot.com/', 0, 0, 'LSZC'),
(189, 'Webcam Oberaar', 'https://grimselwelt.roundshot.com/oberaar/#/', 46.5485, 8.27599, NULL),
(190, 'Webcam Aeroclub', 'https://aeroclub-geneve.roundshot.com/#/', 0, 0, 'LSGG'),
(191, 'Plage du Vegneron', 'https://vengeron.roundshot.com/#/', 46.2456, 6.15373, NULL),
(192, 'Dôle', 'https://dole.roundshot.com/#/', 46.4306, 6.12604, NULL),
(193, 'Pilgerhaus Maria-Rickenbach', 'https://pilgerhaus-maria-rickenbach.roundshot.com/#/', 46.9272, 8.42675, NULL),
(194, 'Flumserberg Leist', 'https://flumserberg.roundshot.com/leist/#/', 47.065, 9.23286, NULL),
(195, 'Napoleonturm zu Hohenrain', 'https://napoleonturm.roundshot.com/#/', 47.6383, 9.08776, NULL),
(196, 'Pizzo Matro', 'https://pizzomatro.roundshot.com/#/', 46.4099, 8.92465, NULL),
(197, 'Zermatt Rothorn', 'https://zbag.roundshot.com/rothorn/#/', 46.0215, 7.79741, NULL),
(198, 'Arolla', 'https://evoleneregion.roundshot.com/arolla/#/', 46.0185, 7.46913, NULL),
(199, 'Evolène', 'https://evoleneregion.roundshot.com/evolene/#/', 46.121, 7.45564, NULL),
(200, 'Eischoll', 'https://eischoll.roundshot.com/dorf/#/', 46.2956, 7.77809, NULL),
(201, 'Meteo - Webcams', 'https://chablaisheliclub.ch/meteo/', 0, 0, 'LSGB'),
(202, 'Tour de Sauvabelin', 'https://tour-de-sauvabelin.ch/webcam/', 46.5353, 6.63846, NULL),
(203, 'Matterhorn Glacier Paradise', 'https://zbag.roundshot.com/matterhornglacierparadise/#/', 45.938, 7.73008, NULL);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
