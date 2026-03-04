import math

# Standard GSM-7 character set (basic + extended)
gsm7_chars = set([
    '@', '£', '$', '¥', 'è', 'é', 'ù', 'ì', 'ò', 'Ç', '\n', 'Ø', 'ø', '\r', 'Å', 'å',
    'Δ', '_', 'Φ', 'Γ', 'Λ', 'Ω', 'Π', 'Ψ', 'Σ', 'Θ', 'Ξ', '\x1B', 'Æ', 'æ', 'ß', 'É',
    ' ', '!', '"', '#', '¤', '%', '&', "'", '(', ')', '*', '+', ',', '-', '.', '/',
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', ':', ';', '<', '=', '>', '?',
    '¡', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O',
    'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'Ä', 'Ö', 'Ñ', 'Ü', '§',
    '¿', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o',
    'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'ä', 'ö', 'ñ', 'ü', 'à'
])

# Extended GSM characters take 2 bytes (count as 2 chars in calculation)
gsm7_extended_chars = set(['^', '{', '}', '\\', '[', '~', ']', '|', '€'])

def get_encoding(text: str) -> str:
    """Determine the encoding type for a given text."""
    for char in text:
        if char not in gsm7_chars and char not in gsm7_extended_chars:
            return 'UCS-2'
    return 'GSM-7'

def calculate_segments(text: str) -> dict:
    """
    Calculate SMS segments similarly to Twilio.
    Returns:
        dict with: encoding, segments, charCount, bytes, perSegmentLimit, maxSingleSegment
    """
    if not text:
        return {
            "encoding": "GSM-7",
            "segments": 0,
            "charCount": 0,
            "bytes": 0,
            "perSegmentLimit": 153,
            "maxSingleSegment": 160
        }

    encoding = get_encoding(text)
    
    # In Javascript counting text.length for unicode, JS does utf-16.
    # Python len() on a string counts unicode codepoints. 
    # For standard Twilio billing, UCS-2 uses 16-bit encoding (2 bytes per character).
    # Surrogate pairs count as 2 logical characters in GSM specs (often standard for emojis).
    # Since python handles emojis as 1 length codepoints, we encode to utf-16-be and divide by 2 
    # to roughly mimic javascript length behavior for characters outside BMP.
    
    if encoding == 'GSM-7':
        bytes_count = 0
        for char in text:
            if char in gsm7_extended_chars:
                bytes_count += 2
            else:
                bytes_count += 1
        char_count = bytes_count
    else:
        # UTF-16 length logic for exact Twilio segment mimicking
        encoded = text.encode('utf-16-be')
        char_count = len(encoded) // 2
        bytes_count = len(encoded)

    segments = 1
    max_single_segment = 160
    per_segment_limit = 153

    if encoding == 'UCS-2':
        max_single_segment = 70
        per_segment_limit = 67

    if char_count > max_single_segment:
        segments = math.ceil(char_count / per_segment_limit)

    return {
        "encoding": encoding,
        "segments": segments,
        "char_count": char_count,
        "bytes": bytes_count,
        "per_segment_limit": per_segment_limit,
        "max_single_segment": max_single_segment
    }

def estimate_cost(segments: int, recipients_count: int, cost_per_segment: float = 0.0079) -> float:
    return round(segments * recipients_count * cost_per_segment, 4)
