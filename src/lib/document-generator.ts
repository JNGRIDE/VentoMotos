import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
// @ts-ignore
import JSZipUtils from "jszip-utils";
import { saveAs } from "file-saver";

const loadFile = (url: string, callback: (err: Error | null, data: string | null) => void) => {
  JSZipUtils.getBinaryContent(url, callback);
};

export const generateDocument = (templateUrl: string, data: Record<string, any>, outputName: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    loadFile(templateUrl, function (error: Error | null, content: string | null) {
      if (error) {
        console.error(`Error loading template ${templateUrl}:`, error);
        reject(new Error(`Error al cargar la plantilla ${templateUrl}: ${error.message}`));
        return;
      }

      if (!content) {
        reject(new Error(`Error: El contenido de la plantilla ${templateUrl} está vacío.`));
        return;
      }

      try {
        const zip = new PizZip(content);
        const doc = new Docxtemplater(zip, {
          paragraphLoop: true,
          linebreaks: true,
        });

        // Render the document
        doc.render(data);

        const out = doc.getZip().generate({
          type: "blob",
          mimeType:
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });

        // Output the document using Data-URI
        saveAs(out, outputName);
        resolve();
      } catch (error: any) {
        console.error(`Error generating document ${outputName}:`, error);
         if (error.properties && error.properties.errors instanceof Array) {
          const errorMessages = error.properties.errors
            .map(function (error: any) {
              return error.properties.explanation;
            })
            .join("\n");
           reject(new Error(`Error al generar el documento ${outputName}:\n${errorMessages}`));
        } else {
          reject(new Error(`Error al generar el documento ${outputName}: ${error}`));
        }
      }
    });
  });
};
