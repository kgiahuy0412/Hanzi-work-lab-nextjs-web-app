using System;
using System.IO;

public static class SofficeWordBridge
{
    public static int Main(string[] args)
    {
        string outDir = null;
        string convertTo = null;
        string input = null;

        for (int i = 0; i < args.Length; i++)
        {
            if (args[i] == "--outdir" && i + 1 < args.Length)
            {
                outDir = args[++i];
            }
            else if (args[i] == "--convert-to" && i + 1 < args.Length)
            {
                convertTo = args[++i];
            }
            else if (!args[i].StartsWith("-") && File.Exists(args[i]))
            {
                input = args[i];
            }
        }

        if (string.IsNullOrWhiteSpace(outDir) || string.IsNullOrWhiteSpace(input))
        {
            Console.Error.WriteLine("Missing input or output directory.");
            return 2;
        }

        if (!string.Equals(convertTo, "pdf", StringComparison.OrdinalIgnoreCase))
        {
            Console.Error.WriteLine("This local bridge only supports PDF conversion.");
            return 3;
        }

        Directory.CreateDirectory(outDir);
        string output = Path.Combine(outDir, Path.GetFileNameWithoutExtension(input) + ".pdf");
        dynamic word = null;
        dynamic document = null;
        try
        {
            Type wordType = Type.GetTypeFromProgID("Word.Application");
            if (wordType == null)
            {
                Console.Error.WriteLine("Microsoft Word is unavailable.");
                return 4;
            }
            word = Activator.CreateInstance(wordType);
            word.Visible = false;
            word.DisplayAlerts = 0;
            document = word.Documents.Open(Path.GetFullPath(input), ReadOnly: true, AddToRecentFiles: false);
            document.ExportAsFixedFormat(Path.GetFullPath(output), 17, false, 0, 0, 1, 9999, 0, true, true, 1, true, true, false);
            document.Close(false);
            document = null;
            word.Quit(false);
            word = null;
            Console.WriteLine("convert " + input + " -> " + output);
            return File.Exists(output) && new FileInfo(output).Length > 0 ? 0 : 5;
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine(ex.ToString());
            try { if (document != null) document.Close(false); } catch { }
            try { if (word != null) word.Quit(false); } catch { }
            return 6;
        }
    }
}
