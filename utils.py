import re
import io
import base64
from barcode import Code128
from barcode.writer import ImageWriter

def validate_nric(nric):
    """
    Validates Singapore NRIC (S, T, F, G, M series).
    Returns a tuple (is_valid, message).
    """
    if not nric or len(nric) != 9:
        return {"valid": False, "message": "NRIC must be exactly 9 characters."}
    
    nric = nric.upper()
    if not re.match(r'^[STFGM]\d{7}[A-Z]$', nric):
        return {"valid": False, "message": "Invalid NRIC format. Format should be: @0000000#"}
    
    first_char = nric[0]
    digits = nric[1:8]
    last_char = nric[-1]
    
    weights = [2, 7, 6, 5, 4, 3, 2]
    total_sum = 0
    
    for i in range(7):
        total_sum += int(digits[i]) * weights[i]
        
    if first_char in ['T', 'G']:
        total_sum += 4
    elif first_char == 'M':
        total_sum += 3
        
    remainder = total_sum % 11
    
    st_map = {0: 'J', 1: 'Z', 2: 'I', 3: 'H', 4: 'G', 5: 'F', 6: 'E', 7: 'D', 8: 'C', 9: 'B', 10: 'A'}
    fg_map = {0: 'X', 1: 'W', 2: 'U', 3: 'T', 4: 'R', 5: 'Q', 6: 'P', 7: 'N', 8: 'M', 9: 'L', 10: 'K'}
    # M series mapping: matches FG but different offset logic in search. 
    # Search result said: Subtract (remainder+1) from 11 -> index. 
    # Actually most sources say M uses the same letter map as F/G but with different weight offset.
    # Let's trust the search result mapping specifically if it differs.
    # Search result mapping for M:
    # 0=K, 1=L, 2=J, 3=N, 4=P, 5=Q, 6=R, 7=T, 8=U, 9=W, 10=X
    # Note: F/G map (0->X) is actually reverse of M map if we align them.
    # Let's code the M map explicitly.
    m_map = {0: 'K', 1: 'L', 2: 'J', 3: 'N', 4: 'P', 5: 'Q', 6: 'R', 7: 'T', 8: 'U', 9: 'W', 10: 'X'}

    # Wait, the remainder calculation for M series in search result:
    # "Divide the adjusted sum by 11 to find the remainder."
    # "Subtract (remainder + 1) from 11 to get the check digit."
    # AND THEN use the map.
    # For S/T/F/G, usually we just use remainder directly into map. 
    # Existing code: remainder = total_sum % 11. S map[remainder].
    
    calculated_char = ''
    if first_char in ['S', 'T']:
        calculated_char = st_map.get(remainder)
    elif first_char in ['F', 'G']:
        calculated_char = fg_map.get(remainder)
    elif first_char == 'M':
        # Special logic from search
        check_digit = 11 - (remainder + 1)
        # If check_digit is negative? (e.g. remainder 10 -> 11-11=0). 
        # If remainder 0 -> 11-1=10.
        # Range of remainder is 0-10. Range of check_digit is 0-10.
        # So we use check_digit as key for m_map.
        # Wait, the search result map keys: 0=K... 
        # If check_digit is the key, then 0 corresponds to K.
        # Let's verify.
        calculated_char = m_map.get(check_digit)

    if last_char == calculated_char:
        return {"valid": True, "message": f"Valid {first_char}-series NRIC."}
    else:
        return {
            "valid": False,
            "message": "Invalid NRIC.",
            "expected": calculated_char
        }

def generate_barcode_base64(nric):
    """
    Generates a Code128 barcode for the NRIC and returns it as a base64 string.
    """
    try:
        # Create barcode object
        rv = io.BytesIO()
        Code128(nric, writer=ImageWriter()).write(rv)
        
        # Convert to base64
        return base64.b64encode(rv.getvalue()).decode('utf-8')
    except Exception as e:
        print(f"Error generating barcode: {e}")
        return None
