def NRIC_code(NRIC_no_code):
  weight = (2,7,6,5,4,3,2)  #()this is tuple and cannot be modified
  alpha_singaporean = ('J','Z','I','H','G','F','E','D','C','B','A')
  alpha_foreigner= ('X','W','U','T','R','Q','P','N','M','L','K')
  
  total_sum = 0
  for i in range (len(weight)):
    current_product = weight[i] * int(NRIC_no_code[i+1])
    total_sum += current_product
  
  #if 'T' or 'G' total_sum PLUS G1234567
  if ((NRIC_no_code[0] =='T') or (NRIC_no_code[0] =='G')) :
    total_sum += 4
    
  remainder = total_sum %11
    
    #check if S or F else invalid NRIC
  if ((NRIC_no_code[0] =='S') or (NRIC_no_code[0] =='T')):
    print("NRIC is Singaporean")
    
    return(alpha_singaporean[remainder])
  elif((NRIC_no_code[0] =='F') or (NRIC_no_code[0] =='G')):
    print("NRIC is foreigner")
    return(alpha_foreigner[remainder])
  else:
    return "invalid nric number"
  
text_input = ""

while len(text_input) != 8:
  text_input = input("Please enter correct NRIC without last letter: ")
  if len(text_input) == 8:
    print("Last letter is",NRIC_code(text_input))
  else:
    print("NRIC input should not contain last letter.")
