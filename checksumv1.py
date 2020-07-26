IC=str(input("Enter the IC to be validated :"))
x=(int(IC[1])*2+int(IC[2])*7+int(IC[3])*6+int(IC[4])*5+int(IC[5])*4+int(IC[6])*3+int(IC[7])*2+4)%11 
if IC[-1] == "J" or IC[-1]=="j": 
  y=0 
elif IC[-1]== "Z" or IC[-1]=="z": 
  y=1 
elif IC[-1]== "I" or IC[-1]=="i": 
  y=2 
elif IC[-1] =="H" or IC[-1]=="h": 
  y=3 
elif IC[-1] =="G" or IC[-1]=="g": 
  y=4 
elif IC[-1] =="F" or IC[-1]=="f": 
  y=5 
elif IC[-1] =="E" or IC[-1]=="e": 
  y=6 
elif IC[-1] =="D" or IC[-1]=="d": 
  y=7 
elif IC[-1] =="C" or IC[-1]=="c": 
  y=8 
elif IC[-1] =="B" or IC[-1]=="b":
  y=9 
elif IC[-1] =="A" or IC[-1]=="a": 
  y=10
if x == y: 
  print ("Validity of the IC: True") 
else: 
  print ("Validity of the IC: False")
