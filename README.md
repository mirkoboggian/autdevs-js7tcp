# S7Tcp
**S7TCP** permette di scambiare dati "non ottimizzati" in lettura/scrittura con alcuni modelli dei PLC Siemens (S7300/400, S71200/1500).
Il progetto è stato creato e testato su MacOSX utilizzando Visual Studio Code e non utilizza alcun package esterno.
Le richieste via socket sono gestite in maniera asincrona.
Ho testato parecchie letture/scritture a intervalli di 10ms e l'unico limite è la console che non riesce a mostrare l'output.
Il progetto è (o sarà) presente in 3 versioni:
* js7tcp: Java Script
* ts7tcp: Type Script
* cs7tcp: C Sharp

## Caratteristiche del driver
La base di questo progetto è un mio progetto C# sviluppato circa 10 anni fa e realizzato semplicemente tramite Reverse-Engineering. 
Cercando in rete ho trovato alcuni progetti che mi hanno permesso di commentare e migliorare la parte relativa al protocollo di comunicazione:
* [libnodave](http://libnodave.sourceforge.net/) (C, C++) 
* [sharp7](http://snap7.sourceforge.net/sharp7.html) (C#)

Rispetto ai progetti sopra elencati questo è un "semplice" driver di scambio dati per le aree dati più comuni nei miei progetti (DB, Merker, Input, Output) ma con performance nettamente superiori sia in fase di sviluppo che di utilizzo.

## Caratteristiche
Al momento il Driver è stato realizzato con queste caratteristiche:
* Tipo di accesso ai dati non ottimizzati (assoluti)
* Letture/Scritture con PDU massimo di 960 Bytes (942 bytes in lettura, 925/932 bytes in scrittura)
* Letture/Scitture Multiple di dati non consecutivi (aggregazione massima 20 tag)
* Letture/Scritture nativive anche dei tipi Bit

## TagPath
Ho cercato di uniformare la definizione dell'indirizzo assoluto (path) in modo che questo contenga tutte le informazioni necessarie (area, tipo, offset, bit, array). Ad esempio sono definizione valide (non CASE sensitive):
* _DB10.DBR40[10]_: viene indirizzata l'area DB 10 a partire dall'offset 40 con un array di 10 Reali.
* _DB10.DBS20[18]_: viene indirizzata l'area DB 10 a partire dall'offset 20 con una stringa di 18 Caratteri.
* _DB10.DBX0.5_: viene indirizzato il bit 5 dell'area DB10 dell'offset 0.
* _MC100[10]_: viene indirizzata l'area M100 con un array di 10 caratteri.
  
Un tag è formato dalle seguenti proprietà:
* DB: eventuale numero della DB
* AreaCode: DB, M, A, E ...
* TypeCode: X, B, UB, C, W, I, UI, DW, DI, UD, R, S (non gestite CN, TM)
* Offset: spiazzamento iniziale in Byte
* Bit: se presente indica il Bit del BYTE di offset (0-7)
* Array: se presente indica la dimensione dell'array o della stringa

I TypeCode identificano i tipi base (bit, byte, caratteri, valori interi a 16/32 bit con e senza segno, valori reali 32bit e stringhe). Le proprietà permettono anche di creare elenchi/gruppi ordinati di Tag ordinati per ridurre il numero di letture e sono presenti alcune funzioni create ad-hoc per questo.

### Regole di definizione dei PATH:
* Ogni tag DEVE avere SEMPRE specificato almeno:
    * AreaCode, TypeCode, Offset
* Se l'AreaCode è DB deve essere specificato il numero della DB
* Se si definisce una String la dimensione DEVE essere specificata nel campo Array
* Non si possono fare Array di Bit
* Non si possono fare Array di String

### Istanze tramite configurazione
E' possibile creare istanze di S7Socket e S7tag passando direttamente l'oggetto che li identifica (ad esempio configurando il condig.json in modo opportuno).

## TODO
* Effettuare un PING prima di tentare la connessione via socket riduce i tempi di attesa in caso di device non connesso
* TagPath: L'espressione regolare non è GARANTITA. Non sono un esperto. Chi può la migliori.
* Se una richiesta di lettura/scrittura esce dai limiti PDU serve splittare la richiesta in multirichieste.
* Aggiungere la conversione di S5Time (li usavo nei vecchi progetti)

## NOTE
* Le letture/scritture Timer/Contatori non verranno mai testate/implementate.