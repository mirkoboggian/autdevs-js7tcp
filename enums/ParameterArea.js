var ParameterArea = {
    S5RawMemory: 0x00,	           /* Just the raw memory */
    S7200SystemInfo: 0x03,         /* System info of 200 family */
    S7200SystemFlags: 0x05,        /* System flags of 200 family */
    S7200AnalogInput: 0x06,        /* Analog inputs of 200 family */
    S7200AnalogOutput: 0x07,       /* Analog outputs of 200 family */
    Peripheral: 0x80,              /* Direct peripheral access */
    Inputs: 0x81,                  /* PE > Peripheral Inputs */
    Outputs: 0x82,                 /* PA > Peripheral Outputs */
    Flags: 0x83,                   /* Merkers */
    DB: 0x84,                      /* Data Blocks */
    DI: 0x85,                      /* Instance data blocks */
    S5SystemData: 0x86,            /* System data area */
    V: 0x87,                       /* Don't know what it is */
    S7Counter: 0x1C,	             /* S7 counters */
    S7Timer: 0x1D,	               /* S7 timers */
    S7200Counter: 0x1E,	           /* IEC counters (200 family) */
    S7200Timer: 0x1F	             /* IEC timers (200 family) */
};

if (Object.freeze)
  Object.freeze(ParameterArea);

module.exports = ParameterArea;