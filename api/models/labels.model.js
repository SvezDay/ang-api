module.exports = {
  label_list: [
    {"Account": "Personal_account"},
    {"Account": "Business_account"},

    {"Container": "Note"},
    {"Container": "Course"},
    {"Container": "Project"},

    {"Property": "Undefined"},
    {"Property": "CUSTOM"},
    {"Property": "Title"},
    {"Property": "Introduction"},
    {"Property": "Example"},
    {"Property": "Definition"},
    // {"Property": "Property_Theorem"},
    {"Property": "Property"},
    {"Property": "Theorem"},
    {"Property": "Rule"},
    {"Property": "Predicat"},

    {"Property": "Method"},
    {"Property": "Mecanism"},

    {"Property": "QuestionTest"},
    {"Property": "SolutionTest"},

    // {"Addon": "Explanation"}
    {"Property": "Comment"},
    {"Property": "Correspondence"},
    {"Property": "Synonym"}
  ],
  primary_model_list: [
    {name: "Mathematics Essential", composition: ["Definition", "Property", "Method"]},
    {name: "Mathematics Detailed", composition: ["Definition", "Property", "Method", "QuestionTest", "SolutionTest"]},
    {name: "Mathematics Addon", composition: ["Method", "QuestionTest", "SolutionTest"]},
    {name: "Pedagogy", composition: ["Introduction", "Example", "Property", "Rule"]},
    // {"Language translate": []}
  ],
  recallable_label_list: [
    {"Undefined": []},
    {"CUSTOM": []},
    {"Title": ['Definition', 'Property', 'Theorem', 'Rule', 'Predicat', 'Method', 'Mecanism']},
    {"Introduction": []},
    {"Example": []},
    {"Definition": ['Title', 'Property', 'Theorem', 'Rule', 'Predicat', 'Method', 'Mecanism']},
    {"Property": ['Title', 'Definition', 'Theorem', 'Rule', 'Predicat', 'Method', 'Mecanism']},
    {"Theorem": ['Title', 'Definition', 'Property', 'Rule', 'Predicat', 'Method', 'Mecanism']},
    {"Predicat": ['Title', 'Definition', 'Property', 'Theorem', 'Rule', 'Method', 'Mecanism']},
    {"Rule": ['Title', 'Definition', 'Property', 'Theorem', 'Predicat', 'Method', 'Mecanism']},
    {"Method": ['Title', 'Definition', 'Property', 'Theorem', 'Rule', 'Predicat', 'Mecanism']},
    {"Mecanism": ['Title', 'Definition', 'Property', 'Theorem','Rule', 'Predicat', 'Method']},
    {"QuestionTest": ['SolutionTest']},
    {"SolutionTest": []},
    {"Comment": []},
    {"Correspondence": []},
    {"Synonym": []}
  ],
  // echangable_label: [
  //   {"Introduction","Example"},
  //   {"Definition", "Property", "Theorem", "Predicat", "Rule"},
  //   {"Method", "Mecanism"},
  //   {"Comment", "Correspondence", "Synonym"}
  // ]

};


/*   from x to y    or    (x) -> (y)

\ to      |course          |Definition      |Property_Theorem   |Method           |Example          |Solution         |
____from__\_________|________________|________________|___________________|_________________|_________________|_________________|
course              |0               |1               |1                  |1                |0                |0                |
Definition          |1               |0               |1                  |1                |0                |0                |
Property_Theorem    |1               |1               |0                  |1                |0                |0                |
Method              |1               |1               |1                  |0                |0                |0                |
Example             |0               |0               |0                  |0                |0                |0                |
Solution            |0               |0               |0                  |0                |1                |0                |
Introduction

*/
