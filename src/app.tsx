import {
  Button,
  LoadingIndicator,
  ProgressBar,
  Rows,
  Select,
  Text,
  TextInput,
} from "@canva/app-ui-kit";
import OpenAI from "openai";
import { useState, useEffect } from "react";
import * as styles from "styles/components.css"; // Ensure your styles are here
import { useSelection } from "utils/use_selection_hook";

const openai = new OpenAI({
  dangerouslyAllowBrowser: true,
});

export const App = () => {
  const [inputValue, setInputValue] = useState<string>("");
  const [selectedText, setSelectedText] = useState<string>("");
  const [inputError, setInputError] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<string>("Resume");
  const [state, setState] = useState<"loading" | "idle">("idle");

  const selection = useSelection("plaintext");
  const isElementSelected = selection.count > 0;

  useEffect(() => {
    const updateSelectedText = async () => {
      if (selection.count > 0) {
        const draft = await selection.read();
        if (draft.contents.length > 0) {
          setSelectedText(draft.contents[0].text);
          //setSelectionWarning(false);
        }
      } else {
        setSelectedText("");
        //setSelectionWarning(true);
      }
    };

    updateSelectedText();
  }, [selection]);

  const handleChange = (value: string) => {
    setInputValue(value);
    setInputError(false);
  };

  const handleSelectChange = (value: string) => {
    setSelectedOption(value);
  };

  const getPromptContent = () => {
    switch (selectedOption) {
      case "Resume":
        return `
          You will be provided with a section of a resume and a job description, both delimited with XML tags.
          1. Identify the type of resume section provided (e.g., education, experience, skills, statement, job title, etc.).
          2. Rewrite the resume section to make it more relevant to the job description.
          3. If the section is identified as "Skills," generate the same number of skills that match the job description and ensure it is returned in a bullet-point style as an array of skills.
          4. Return the output as a JSON object in the following format: 
          {
            "section_name": "<Identified section type>",
            "revised_section": "<Rewritten resume section>"
          }
        `;
      case "Cover-letter":
        return `
          You will be provided with the section of a cover letter and a job description, both delimited with XML tags.
          1. Rewrite the cover letter section to make it more relevant to the job description.
          2. Ensure the cover letter is professional, concise, and tailored to the job description.
          3. Return the output as a JSON object in the following format: 
          {
            "revised_section": "<Rewritten cover letter section>"
          }
        `;
      default:
        return "";
    }
  };

  const onClick = async () => {
    try {
      setState("loading");

      if (inputValue.trim() === "") {
        setInputError(true);
        setState("idle");
        return;
      }

      if (!isElementSelected) {
        //setSelectionWarning(true);
        setState("idle");
        return;
      }

      const draft = await selection.read();

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: getPromptContent(),
            content: getPromptContent(),
          },
          {
            role: "user",
            content: `<section>${selectedText}</section><job_description>${inputValue}</job_description>`,
            content: `<section>${selectedText}</section><job_description>${inputValue}</job_description>`,
          },
        ],
      });
//3. If the section is identified as "Skills," generate same number of skills that match to the job description and ensure it is returned in a bullet-point style as an array of skills.
// 3. If the section is identified as "Skills," if skill is already relevant to the role do not change else replace with skill that matches the job description and finally returned in a bullet-point style as an array of skills.

      const result = completion.choices[0].message.content;
      const revised = JSON.parse(result ?? "{}");
      const finalText = revised.revised_section;

      if (revised.section_name === "Skills") {
        const formattedSkills = finalText.join("\n");
        for (const content of draft.contents) {
          content.text = `${formattedSkills}`;
        }
      } else {
        for (const content of draft.contents) {
          content.text = finalText ?? "this is the default value";
        }
      }
``
      await draft.save();
    } catch (error) {
      console.error("Error updating the content:", error);
    } finally {
      setState("idle");
    }
  };

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
  };

  return (
    <div className={styles.scrollContainer}>
      <Rows spacing="2u">
        <Text variant="bold" size="large">
          Add pepper
        </Text>
        <Select
          options={[
            {
              label: "Resume",
              value: "Resume",
            },
            {
              label: "Cover-letter",
              value: "Cover-letter",
            },
            {
              label: "Custom",
              value: "Custom",
              description:
                "UNAVAILABLE",
              disabled: true,
            },
          ]}
          stretch
          value={selectedOption}
          onChange={handleSelectChange}
        />

        <TextInput
          placeholder={
            inputError ? "Text input is empty" : "Enter Job description"
          }
          value={inputValue}
          onChange={handleChange}
          error={inputError}
          error={inputError}
        />

        {/* Styled container for selected text */}
        <div className={styles.selectedTextContainer}>
          <Text tone={selectedText ? "primary" : "critical"}>
            {truncateText(selectedText || "No text selected", 100)}
          </Text>
        </div>
        <Button
          loading={state === "loading"}
          disabled={state === "loading"}
          variant="primary"
          onClick={onClick}
        >
          do something cool
        </Button>
      </Rows>
    </div>
  );
};
