# s7tcp

* Tipo di accesso ai dati non ottimizzati (SOLO QUELLO!)
* Letture fino a 942 Bytes consecutivi
* Scritture fino a 932 Bytes consecutivi
* Letture Multiple di dati non consecutivi (aggregazione massima 20 tag)
* Scritture Multiple di dati non consecutivi (aggregazione massima 20 tag)

## NOTE
* Testate solo letture/scrittre su DB
* Le letture/scritture a bit sono state implementate solo in parte (NON LE COMPLETERO' MAI)
* Le letture/scritture Timer/Contatori sono state implementate solo in parte (NON LE COMPLETERO' MAI)

## TODO
* Letture/Scritture multiple: verifica che la lunghezza della richiesta sia compatibile con la lunghezza massima del PDU (per farlo server la dichiarazione del TIPO nel Tag)
* Tag: conversione in base al tipo (da byte[] a Tipo e viceversa) 
* Tag: costruttore con l'indirizzo assoluto

