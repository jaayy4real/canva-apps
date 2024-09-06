import { Button, Rows, Text, TextInput } from "@canva/app-ui-kit";
import { addNativeElement } from "@canva/design";
import OpenAI from "openai";
import { useState, useEffect } from "react";
import * as styles from "styles/components.css";
import { useSelection } from "utils/use_selection_hook";
// const api = process.env.API_KEY
const openai = new OpenAI({

  dangerouslyAllowBrowser: true,
});

export const App = () => {
  const [inputValue, setInputValue] = useState<string>("");
  const [selectedText, setSelectedText] = useState<string>("");

  const selection = useSelection("plaintext");

  useEffect(() => {
    const updateSelectedText = async () => {
      if (selection.count > 0) {
        const draft = await selection.read();
        if (draft.contents.length > 0) {
          setSelectedText(draft.contents[0].text);
        }
      } else {
        setSelectedText("");
      }
    };

    updateSelectedText();
  }, [selection]);

  const handleChange = (value: string) => {
    setInputValue(value);
  };

  const onClick = async () => {
    try {
      const draft = await selection.read();

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `
            You will be provided with a section of a resume and a job description, both delimited with XML tags.
            
            1. Identify the type of resume section provided (e.g., education, experience, skills, statement, job title, etc.).
            2. Rewrite the resume section to make it more relevant to the job description.
            3. If the section is identified as "Skills," ensure it is returned in a bullet-point style as an array of skills.
            4. Return the output as a JSON object in the following format: 
            
            {
              "section_name": "<Identified section type>",
              "revised_section": "<Rewritten resume section>"
            }
            `,
          },
          {
            role: "user",
            content: `<resume_section>${selectedText}</resume_section><job_description>${inputValue}</job_description>`,
          },
        ],
      });

      const result = completion.choices[0].message.content;
      const revised = JSON.parse(result ?? "{}");
      const finalText = revised.revised_section;

      // Update the selected content in Canva based on the section type
      if (revised.section_name === "Skills") {
        const formattedSkills = finalText.join("\n• "); // Convert array to bullet-point format
        for (const content of draft.contents) {
          content.text = `• ${formattedSkills}`; // Add bullets
        }
      } else {
        for (const content of draft.contents) {
          content.text = finalText ?? "this is the default value";
        }
      }

      await draft.save();
    } catch (error) {
      console.error("Error updating the content:", error);
    }
  };

  const update = async () => {
    try {
      const draft = await selection.read();
      const newContents: string[] = [];

      for (const content of draft.contents) {
        const updatedText = `${content.text}!`;
        addNativeElement({
          type: "TEXT",
          children: [process.env.API_KEY + 'HHHH'??'content'],
        });

        newContents.push(content.text);
      }
    } catch (error) {
      console.error("Error updating elements:", error);
    }
  };

  return (
    <div className={styles.scrollContainer}>
      <Rows spacing="2u">
        <TextInput
          placeholder="Enter something..."
          value={inputValue}
          onChange={handleChange}
        />
        <Text>
          To make changes to this app, edit the <code>src/app.tsx</code> file,
          then close and reopen the app in the editor to preview the changes.
        </Text>
        <Text>{selectedText}</Text>
        <Button variant="primary" onClick={onClick} stretch>
          Do something cool
        </Button>
        <Button variant="primary" onClick={update}>
          lalala
        </Button>
      </Rows>
    </div>
  );
};
