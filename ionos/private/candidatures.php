<?php
declare(strict_types=1);

const SISI_NOTION_VERSION = '2026-03-11';
const SISI_MAX_BODY = 20000;

function sisi_reply(int $status, array $body): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}

function sisi_invalid(): void {
    throw new InvalidArgumentException('invalid');
}

function sisi_text(mixed $value, int $max = 200): string {
    if (!is_string($value) || !preg_match('//u', $value)) return '';
    $value = trim($value);
    $length = function_exists('mb_strlen') ? mb_strlen($value, 'UTF-8') : strlen($value);
    if ($length > $max) sisi_invalid();
    return $value;
}

function sisi_choices(mixed $value, array $allowed): array {
    if (!is_array($value)) return [];
    $result = [];
    foreach ($value as $item) {
        if (!is_string($item) || !in_array($item, $allowed, true)) sisi_invalid();
        if (!in_array($item, $result, true)) $result[] = $item;
        if (count($result) > 12) sisi_invalid();
    }
    return $result;
}

function sisi_phone(string $value): bool {
    return (bool)preg_match('/^[+\d\s().-]{7,30}$/', $value)
        && preg_match_all('/\d/', $value) >= 7;
}

function sisi_allowed(): array {
    return [
        'destinations' => ['Johannesburg', 'Cape Town', 'Tuléar', 'Hoedspruit', 'Tanzanie', 'Je suis ouverte'],
        'ageRange' => ['', '18–25 ans', '26–35 ans', '36–45 ans', '46–55 ans', '56 ans et plus'],
        'source' => ['Instagram', 'LinkedIn', 'Une amie / le bouche-à-oreille', 'Recherche internet', 'Un événement', 'Autre'],
        'periods' => ['Dans les 3 mois', 'Dans les 6 mois', "Dans l'année", 'Plus tard / flexible'],
        'duration' => ['5 à 7 jours', '8 à 10 jours', '11 à 14 jours', 'Je suis flexible'],
        'budget' => ['Moins de 1 500 €', '1 500 à 2 500 €', '2 500 à 3 500 €', 'Plus de 3 500 €', 'À discuter'],
        'motivations' => ['Me reconnecter à moi', "Rencontrer d'autres femmes", "Découvrir l'Afrique autrement", "Trouver de l'inspiration"],
        'experiences' => ['Culture et rencontres', 'Nature et aventure', 'Bien-être et ateliers', 'Gastronomie, beauté et lifestyle'],
        'travelStyle' => ['Doux et contemplatif', 'Équilibré', 'Actif et curieux'],
        'room' => ['Chambre individuelle', 'Chambre partagée si possible', 'À voir selon le tarif'],
        'companions' => ['Seule', 'Accompagnée', 'Je ne sais pas encore'],
        'callbackTime' => ['', 'En semaine, le matin', "En semaine, l'après-midi", 'En semaine, le soir', 'Le week-end'],
    ];
}

function sisi_qualification(string $key): array {
    return match ($key) {
        'identified' => ['Voyage identifié', 'Haute', 'Aucune'],
        'callback' => ['À rappeler', 'Haute', 'Appel téléphonique'],
        'future' => ['Projet futur', 'Basse', 'Aucune'],
        default => throw new InvalidArgumentException('invalid'),
    };
}

function sisi_normalize(array $raw): array {
    $allowed = sisi_allowed();
    $lengths = [
        'reference' => 60, 'firstName' => 80, 'lastName' => 80, 'email' => 254,
        'whatsapp' => 30, 'departureCity' => 100, 'departureCountry' => 100,
        'ageRange' => 50, 'source' => 80, 'duration' => 80, 'budget' => 80,
        'travelStyle' => 80, 'room' => 80, 'companions' => 80,
        'qualification' => 20, 'identifiedTrip' => 150, 'callbackTime' => 80,
        'callbackPhone' => 30, 'futurePeriod' => 120, 'website' => 100,
    ];
    $p = [];
    foreach ($lengths as $key => $max) $p[$key] = sisi_text($raw[$key] ?? '', $max);
    $p['email'] = strtolower($p['email']);
    foreach (['destinations', 'periods', 'motivations', 'experiences'] as $key) {
        $p[$key] = sisi_choices($raw[$key] ?? [], $allowed[$key]);
    }
    $p['marketing'] = ($raw['marketing'] ?? false) === true;
    if ($p['website'] !== '') sisi_invalid();
    if (!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i', $p['reference'])) sisi_invalid();
    if ($p['firstName'] === '' || $p['lastName'] === '' || !filter_var($p['email'], FILTER_VALIDATE_EMAIL)
        || !sisi_phone($p['whatsapp']) || $p['departureCity'] === '' || $p['departureCountry'] === '') sisi_invalid();
    foreach (['ageRange', 'source', 'duration', 'budget', 'travelStyle', 'room', 'companions', 'callbackTime'] as $key) {
        if (!in_array($p[$key], $allowed[$key], true)) sisi_invalid();
    }
    foreach (['destinations', 'periods', 'motivations', 'experiences'] as $key) {
        if ($p[$key] === []) sisi_invalid();
    }
    if ($p['source'] === '' || $p['duration'] === '' || $p['budget'] === '' || $p['travelStyle'] === ''
        || $p['room'] === '' || $p['companions'] === '') sisi_invalid();
    sisi_qualification($p['qualification']);
    if ($p['qualification'] === 'identified' && $p['identifiedTrip'] === '') sisi_invalid();
    if ($p['qualification'] === 'callback'
        && ($p['callbackTime'] === '' || !sisi_phone($p['callbackPhone'] ?: $p['whatsapp']))) sisi_invalid();
    if ($p['qualification'] !== 'identified') $p['identifiedTrip'] = '';
    if ($p['qualification'] !== 'callback') {
        $p['callbackTime'] = '';
        $p['callbackPhone'] = '';
    }
    if ($p['qualification'] !== 'future') $p['futurePeriod'] = '';
    return $p;
}

function sisi_config(): array {
    $file = __DIR__ . '/config.php';
    $config = is_file($file) ? require $file : [];
    if (!is_array($config)) $config = [];
    $config['notion_token'] = getenv('NOTION_API_KEY') ?: ($config['notion_token'] ?? '');
    $config['notion_data_source_id'] = getenv('NOTION_DATA_SOURCE_ID') ?: ($config['notion_data_source_id'] ?? 'a0bb33cf-eced-481e-bb0d-a3a83f70364e');
    return $config;
}

function sisi_notion(string $path, array $payload, array $config): array {
    if (!function_exists('curl_init')) throw new RuntimeException('curl_unavailable');
    $curl = curl_init('https://api.notion.com/v1' . $path);
    if ($curl === false) throw new RuntimeException('curl_unavailable');
    curl_setopt_array($curl, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $config['notion_token'],
            'Notion-Version: ' . SISI_NOTION_VERSION,
            'Content-Type: application/json',
        ],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 12,
    ]);
    $response = curl_exec($curl);
    $status = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    curl_close($curl);
    if ($response === false || $status < 200 || $status >= 300) {
        // Never log Notion's response: it may echo submitted personal data.
        throw new RuntimeException('notion_unavailable');
    }
    $decoded = json_decode($response, true);
    if (!is_array($decoded)) throw new RuntimeException('notion_unavailable');
    return $decoded;
}

function sisi_find_reference(string $reference, array $config): ?string {
    $result = sisi_notion('/data_sources/' . rawurlencode($config['notion_data_source_id']) . '/query', [
        'filter' => ['property' => 'Référence soumission', 'rich_text' => ['equals' => $reference]],
        'page_size' => 1,
    ], $config);
    $id = $result['results'][0]['id'] ?? null;
    return is_string($id) ? $id : null;
}

function sisi_rich(string $value): array {
    return ['rich_text' => [['text' => ['content' => $value !== '' ? $value : '—']]]];
}

function sisi_paragraph(string $label, string $value): array {
    return ['object' => 'block', 'type' => 'paragraph', 'paragraph' => [
        'rich_text' => [['type' => 'text', 'text' => ['content' => $label . ' : ' . ($value !== '' ? $value : '—')]]],
    ]];
}

function sisi_page(array $p, array $config): array {
    [$intention, $priority, $action] = sisi_qualification($p['qualification']);
    $destinations = array_values(array_filter($p['destinations'], fn($v) => $v !== 'Je suis ouverte'));
    $props = [
        'Candidature' => ['title' => [['text' => ['content' => $p['firstName'] . ' ' . $p['lastName']]]]],
        'Prénom' => sisi_rich($p['firstName']),
        'Nom' => sisi_rich($p['lastName']),
        'Email' => ['email' => $p['email']],
        'WhatsApp' => ['phone_number' => $p['whatsapp']],
        'Départ' => sisi_rich($p['departureCity'] . ', ' . $p['departureCountry']),
        'Destinations' => ['multi_select' => array_map(fn($v) => ['name' => $v], $destinations)],
        'Intention' => ['select' => ['name' => $intention]],
        'Priorité' => ['select' => ['name' => $priority]],
        'Action' => ['select' => ['name' => $action]],
        'Suivi commercial' => ['status' => ['name' => 'Nouveau']],
        'Voyage repéré' => sisi_rich($p['identifiedTrip']),
        'Consentement marketing' => ['checkbox' => $p['marketing']],
        'Référence soumission' => sisi_rich($p['reference']),
    ];
    if ($p['callbackPhone'] !== '' || $p['qualification'] === 'callback') {
        $props['Téléphone rappel'] = ['phone_number' => $p['callbackPhone'] ?: $p['whatsapp']];
    }
    $sections = [
        'Coordonnées' => [
            'Prénom et nom' => $p['firstName'] . ' ' . $p['lastName'], 'Email' => $p['email'],
            'WhatsApp' => $p['whatsapp'], 'Ville et pays de départ' => $p['departureCity'] . ', ' . $p['departureCountry'],
            "Tranche d'âge" => $p['ageRange'], 'Découverte de Sisi' => $p['source'],
        ],
        'Ton voyage' => [
            'Destinations' => implode(', ', $p['destinations']), 'Périodes' => implode(', ', $p['periods']),
            'Durée' => $p['duration'], 'Budget hors vol international' => $p['budget'],
        ],
        'Ta façon de voyager' => [
            'Motivations' => implode(', ', $p['motivations']), 'Expériences' => implode(', ', $p['experiences']),
            'Rythme' => $p['travelStyle'], 'Hébergement' => $p['room'],
        ],
        'Ton projet' => [
            'Voyage seule ou accompagnée' => $p['companions'], 'Qualification' => $intention,
            'Voyage repéré' => $p['identifiedTrip'], 'Moment pour être rappelée' => $p['callbackTime'],
            'Numéro pour rappel' => $p['callbackPhone'] ?: $p['whatsapp'], 'Période future' => $p['futurePeriod'],
            'Consentement marketing' => $p['marketing'] ? 'Oui' : 'Non',
        ],
    ];
    $children = [];
    foreach ($sections as $title => $rows) {
        $children[] = ['object' => 'block', 'type' => 'heading_2', 'heading_2' => ['rich_text' => [['text' => ['content' => $title]]]]];
        foreach ($rows as $label => $value) $children[] = sisi_paragraph($label, $value);
    }
    $children[] = sisi_paragraph('Date d’inscription', gmdate('c'));
    return [
        'parent' => ['type' => 'data_source_id', 'data_source_id' => $config['notion_data_source_id']],
        'properties' => $props,
        'children' => $children,
    ];
}

function sisi_state_dir(): string {
    $dir = __DIR__ . '/state';
    if (!is_dir($dir) && !mkdir($dir, 0700, true) && !is_dir($dir)) throw new RuntimeException('state_unavailable');
    return $dir;
}

function sisi_rate_limit(string $token): bool {
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $file = sisi_state_dir() . '/rate-' . hash_hmac('sha256', $ip, $token);
    $handle = fopen($file, 'c+');
    if ($handle === false) throw new RuntimeException('state_unavailable');
    try {
        if (!flock($handle, LOCK_EX)) throw new RuntimeException('state_unavailable');
        $raw = stream_get_contents($handle);
        $times = json_decode($raw ?: '[]', true);
        if (!is_array($times)) $times = [];
        $now = time();
        $times = array_values(array_filter($times, fn($t) => is_int($t) && $now - $t < 600));
        $times[] = $now;
        rewind($handle);
        $encoded = json_encode($times);
        if (!ftruncate($handle, 0) || fwrite($handle, $encoded) !== strlen($encoded) || !fflush($handle)) {
            throw new RuntimeException('state_unavailable');
        }
        return count($times) <= 12;
    } finally {
        flock($handle, LOCK_UN);
        fclose($handle);
    }
}

function sisi_save(array $p, array $config): void {
    $file = sisi_state_dir() . '/ref-' . hash_hmac('sha256', $p['reference'], $config['notion_token']);
    $handle = fopen($file, 'c+');
    if ($handle === false) throw new RuntimeException('state_unavailable');
    try {
        if (!flock($handle, LOCK_EX)) throw new RuntimeException('state_unavailable');
        $state = trim((string)stream_get_contents($handle));
        if (str_starts_with($state, 'saved:')) return;
        $existing = sisi_find_reference($p['reference'], $config);
        if ($existing !== null) {
            sisi_write_state($handle, 'saved:' . $existing);
            return;
        }
        // A previous network timeout may have happened after a successful write.
        // Never send a second create call automatically while the outcome is uncertain.
        if ($state === 'pending') throw new RuntimeException('pending_review');
        sisi_write_state($handle, 'pending');
        $page = sisi_notion('/pages', sisi_page($p, $config), $config);
        if (!is_string($page['id'] ?? null)) throw new RuntimeException('notion_unavailable');
        sisi_write_state($handle, 'saved:' . $page['id']);
    } finally {
        flock($handle, LOCK_UN);
        fclose($handle);
    }
}

function sisi_write_state($handle, string $state): void {
    rewind($handle);
    if (!ftruncate($handle, 0) || fwrite($handle, $state) !== strlen($state) || !fflush($handle)) {
        throw new RuntimeException('state_unavailable');
    }
}

function sisi_handle(): void {
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        sisi_reply(405, ['saved' => false]);
        return;
    }
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $requestHost = parse_url('https://' . ($_SERVER['HTTP_HOST'] ?? ''), PHP_URL_HOST);
    if ($origin !== '' && ($requestHost === false || parse_url($origin, PHP_URL_HOST) !== $requestHost)) {
        sisi_reply(403, ['saved' => false]);
        return;
    }
    if (!str_starts_with(strtolower($_SERVER['CONTENT_TYPE'] ?? ''), 'application/json')) {
        sisi_reply(415, ['saved' => false]);
        return;
    }
    if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > SISI_MAX_BODY) {
        sisi_reply(413, ['saved' => false]);
        return;
    }
    $config = sisi_config();
    if (!is_string($config['notion_token']) || $config['notion_token'] === '') {
        sisi_reply(503, ['saved' => false, 'message' => 'Connexion Notion non configurée.']);
        return;
    }
    try {
        if (!sisi_rate_limit($config['notion_token'])) {
            sisi_reply(429, ['saved' => false, 'message' => 'Réessaie dans quelques minutes.']);
            return;
        }
        $raw = file_get_contents('php://input', false, null, 0, SISI_MAX_BODY + 1);
        if ($raw === false || strlen($raw) > SISI_MAX_BODY) {
            sisi_reply(413, ['saved' => false]);
            return;
        }
        $input = json_decode($raw, true, 32, JSON_THROW_ON_ERROR);
        if (!is_array($input) || array_is_list($input)) sisi_invalid();
        $p = sisi_normalize($input);
        sisi_save($p, $config);
        sisi_reply(200, ['saved' => true]);
    } catch (InvalidArgumentException | JsonException $error) {
        sisi_reply(400, ['saved' => false, 'message' => 'Vérifie les champs du formulaire.']);
    } catch (Throwable $error) {
        // No names, answers, phone numbers or Notion response bodies in logs.
        error_log('Candidature Sisi : échec technique (' . get_class($error) . ')');
        sisi_reply(503, ['saved' => false, 'message' => 'Enregistrement indisponible. Réessaie sans quitter cette page.']);
    }
}
