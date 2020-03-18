# S7Tcp
**S7TCP** permette di scambiare dati "non ottimizzati" in lettura/scrittura con alcuni modelli dei PLC Siemens (S7300/400, S71200/1500).
Il progetto è stato creato e testato su MacOSX utilizzando Visual Studio Code.  
Per questo motivo ho rilasciato nel Git anche la cartella _.vscode_ che può essere utile per i test di debug.

## Caratteristiche del driver
La base di questo progetto è un mio progetto C# sviluppato circa 10 anni fa e realizzato semplicemente tramite Reverse-Engineering. Cercando in rete ho trovato diversi progetti che mi hanno permesso di commentare e migliorare la parte relativa al protocollo di comunicazione:
* [libnodave](http://libnodave.sourceforge.net/) (C, C++) 
* [sharp7](http://snap7.sourceforge.net/sharp7.html) (C#)

Rispetto ai progetti sopra elencati questo è un semplice driver di scambio dati per i dati più comuni:
* DB
* Merker
* Input
* Output

## Limiti del driver
Al momento il Driver è stato realizzato con queste caratteristiche:
* Tipo di accesso ai dati non ottimizzati
* Letture fino a 942 Bytes consecutivi
* Scritture fino a 932 Bytes consecutivi
* Letture Multiple di dati non consecutivi (aggregazione massima 20 tag)
* Scritture Multiple di dati non consecutivi (aggregazione massima 20 tag)

## TagPath
Ho cercato di uniformare la definizione dell'indirizzo assoluto (path) in modo che questo contenga tutte le informazioni necessarie (area, tipo, offset, bit, array). Ad esempio sono definizione valide (non CASE sensitive):
* _DB10.DBR40[10]_: viene indirizzata l'area DB 10 a partire dall'offset 40 con un array di 10 Reali.
* _DB10.DBS20[18]_: viene indirizzata l'area DB 10 a partire dall'offset 20 con una stringa di 18 Caratteri.
* _DB10.DBB0.%5_: viene indirizzato il bit 5 dell'area DB10 dell'offset 0.
* _MC100[10]_: viene indirizzata l'area M100 con un array di 10 caratteri.
  
Un tag è formato dalle seguenti proprietà:
* DB: eventuale numero della DB
* AreaCode: DB, M, A, E ...
* TypeCode: %, B, UB, C, W, I, UI, DW, DI, UD, R, S (non gestite CN, TM)
* Offset: spiazzamento iniziale in Byte
* Bit: se presente indica il Bit del BYTE di offset
* Array: se presente indica la dimensione dell'array o della stringa

I TypeCode identificano i tipi base (bit, byte, valori interi a 16/32 bit con e senza segno, valori reali 32bit e stringhe).

  
Da cui le seguenti regole:
* Ogni tag DEVE avere SEMPRE specificato almeno:
    * AreaCode, TypeCode, Offset
* Se l'AreaCode è DB deve essere specificato il numero della DB
* Se si definisce un Bit il TypeCode DEVE essere Byte
* Se si definisce una String la dimensione massima (Array) DEVE essere specificata
* Non si possono fare Array di Bit
* Non si possono fare Array di String

## In fase di sviluppo
* gestione del driver e dei tags da file config.

## TODO
* Letture/Scritture a Bit non ancora realizzate/testate.
* TagPath: L'espressione regolare non è GARANTITA. Ci sono troppi sottocasi da valutare..
* Eseguire più richeiste di lettura/scrittura per quei Tags o gruppi di Tags che superano i limiti in Bytes per ogni richiesta

## NOTE
* Le letture/scritture Timer/Contatori non verranno mai testate/implementate.