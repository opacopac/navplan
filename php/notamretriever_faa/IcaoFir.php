<?php declare(strict_types=1);

namespace notamretriever_faa;

/**
 * Helper class to identify Flight Information Regions (FIRs) by their ICAO codes
 */
class IcaoFir
{
    /**
     * List of all FIR ICAO codes
     */
    private const FIR_CODES = [
        'AGGG', 'ANAU', 'AYPM', 'BGGL', 'BIRD', 'CZEG', 'CZQM', 'CZQX', 'CZUL', 'CZVR',
        'CZWG', 'CZYZ', 'DAAA', 'DGAC', 'DNKK', 'DRRR', 'DTTC', 'EBBU', 'EDGG', 'EDMM',
        'EDWW', 'EETT', 'EFIN', 'EGGX', 'EGPX', 'EGTT', 'EHAA', 'EISN', 'EKDK', 'ENOB',
        'ENOR', 'EPWW', 'ESAA', 'EVRR', 'EYVL', 'FACA', 'FAJA', 'FAJO', 'FBGR', 'FCCC',
        'FIMM', 'FLFI', 'FMMM', 'FNAN', 'FQBE', 'FSSS', 'FTTT', 'FVHF', 'FWLL', 'FYWH',
        'FZZA', 'GCCC', 'GLRB', 'GMMM', 'GOOO', 'GVSC', 'HAAA', 'HBBA', 'HCSM', 'HECC',
        'HHAA', 'HKNA', 'HLLL', 'HRYR', 'HSSS', 'HTDC', 'HUEC', 'KZAB', 'KZAK', 'KZAU',
        'KZBW', 'KZDC', 'KZDV', 'KZFW', 'KZHU', 'KZID', 'KZJX', 'KZKC', 'KZLA', 'KZLC',
        'KZMA', 'KZME', 'KZMP', 'KZNY', 'KZOA', 'KZOB', 'KZSE', 'KZTL', 'KZWY', 'LAAA',
        'LBSR', 'LCCC', 'LDZO', 'LECB', 'LECM', 'LFBB', 'LFEE', 'LFFF', 'LFMM', 'LFRR',
        'LGGG', 'LHCC', 'LIBB', 'LIMM', 'LIRR', 'LJLA', 'LKAA', 'LLTA', 'LMMM', 'LOVV',
        'LPPC', 'LPPO', 'LQSB', 'LRBB', 'LSAS', 'LTAA', 'LTBB', 'LUUU', 'LWSS', 'LYBA',
        'LZBB', 'MDCS', 'MHTG', 'MKJK', 'MMFO', 'MMFR', 'MPZL', 'MTEG', 'MUFH', 'MYNA',
        'NFFF', 'NTTT', 'NZZC', 'NZZO', 'OAKX', 'OBBB', 'OEJD', 'OIIX', 'OJAC', 'OKAC',
        'OLBB', 'OMAE', 'OOMM', 'OPKR', 'OPLR', 'ORBB', 'OSTT', 'OYSC', 'PAZA', 'RCAA',
        'RJJJ', 'RKRR', 'RPHI', 'SACF', 'SAEF', 'SAMF', 'SARR', 'SAVF', 'SBAO', 'SBAZ',
        'SBBS', 'SBCW', 'SBRE', 'SCCZ', 'SCEZ', 'SCFZ', 'SCIZ', 'SCTZ', 'SEFG', 'SGFA',
        'SKEC', 'SKED', 'SLLF', 'SMPM', 'SOOO', 'SPIM', 'SUEO', 'SVZM', 'SYGC', 'TJZS',
        'TNCF', 'TTZP', 'UAAA', 'UACC', 'UAII', 'UATT', 'UBBA', 'UCFM', 'UCFO', 'UDDD',
        'UEEE', 'UELL', 'UEMO', 'UERP', 'UERR', 'UGGG', 'UHHH', 'UHMM', 'UHPP', 'UIII',
        'UKBV', 'UKDV', 'UKFV', 'UKLV', 'UKOV', 'ULAA', 'ULAM', 'ULKK', 'ULLL', 'ULMM',
        'ULWW', 'UMKK', 'UMMV', 'UNKL', 'UNNT', 'URRV', 'USCC', 'USCM', 'USDD', 'USDK',
        'USDS', 'USKK', 'USPP', 'USSS', 'USTR', 'UTAA', 'UTAK', 'UTAT', 'UTAV', 'UTDD',
        'UTNR', 'UTSD', 'UTTR', 'UUWV', 'UUYY', 'UWKD', 'UWWW', 'VABF', 'VCCF', 'VDPP',
        'VECF', 'VGFR', 'VHHK', 'VIDF', 'VLVT', 'VNSM', 'VOMF', 'VRMF', 'VTBB', 'VVTS',
        'VVVV', 'VYYF', 'WAAF', 'WBFC', 'WIIF', 'WMFC', 'WSJC', 'YBBB', 'YMMM', 'ZBPE',
        'ZGZU', 'ZHWH', 'ZJSA', 'ZKKP', 'ZLHW', 'ZMUB', 'ZPKM', 'ZSHA', 'ZWUQ', 'ZYSH'
    ];

    /**
     * Check if the given ICAO code is a Flight Information Region (FIR)
     *
     * @param string $icao The ICAO code to check (4 letters)
     * @return bool True if the code is a FIR, false otherwise
     */
    public static function isFir(string $icao): bool
    {
        return in_array(strtoupper($icao), self::FIR_CODES, true);
    }
}

