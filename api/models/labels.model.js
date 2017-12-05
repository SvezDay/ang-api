module.exports = {
  label_list: [
    {"Acc": "PersonalAccount"},
    {"Acc": "BusinessAccount"},

    {"Cont": "Note"},
    {"Cont": "Course"},
    {"Cont": "Project"},

    {"Prop": "Undefined"},
    {"Prop": "CUSTOM"},
    {"Prop": "Title"},
    {"Prop": "Introduction"},
    {"Prop": "Example"},
    {"Prop": "Definition"},
    // {"Property": "Property_Theorem"},
    {"Prop": "Prop"},
    {"Prop": "Theorem"},
    {"Prop": "Rule"},
    {"Prop": "Predicat"},

    {"Prop": "Method"},
    {"Prop": "Mecanism"},

    {"Prop": "QuestionTest"},
    {"Prop": "SolutionTest"},
    // {"Addon": "Explanation"}
    {"Prop": "Comment"},
    {"Prop": "Correspondence"},
    {"Prop": "Synonym"}
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
