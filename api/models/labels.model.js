module.exports = {


  label_list: [
    {"Account": "Personal_account"},
    {"Account": "Business_account"},
    {"Container": "Note"},
    {"Container": "Course"},
    {"Container": "Project"},
    {"Property": "Title"},
    {"Property": "Undefined"},
    {"Property": "Definition"},
    {"Property": "Property_Theorem"},
    {"Property": "Method"},
    {"Property": "Example"},
    {"Property": "Solution"},
    {"Addon": "Explanation"}
  ],
  primary_model_list: [
    {title: "Mathematics Essential", composition: ["Definition", "Property_Theorem", "Method"]},
    {title: "Mathematics Detailed", composition: ["Definition", "Property_Theorem", "Method", "Example", "Solution"]},
    {title: "Mathematics Addon", composition: ["Method", "Example", "Solution"]},
    // {"Language translate": []}
  ],

  /*   from x to y    or    (x) -> (y)

            \ to      |course          |Definition      |Property_Theorem   |Method           |Example          |Solution         |
  ____from__\_________|________________|________________|___________________|_________________|_________________|_________________|
  course              |0               |1               |1                  |1                |0                |0                |
  Definition          |1               |0               |1                  |1                |0                |0                |
  Property_Theorem    |1               |1               |0                  |1                |0                |0                |
  Method              |1               |1               |1                  |0                |0                |0                |
  Example             |0               |0               |0                  |0                |0                |0                |
  Solution            |0               |0               |0                  |0                |1                |0                |

  */
  // labelRecallableTargetList: {
  recallable_label_list: [
    {"Course": ['Definition', 'Property_Theorem', 'Method']},
    {"Definition": ['Course', 'Property_Theorem', 'Method']},
    {"Property_Theorem": ['Course', 'Definition', 'Method']},
    {"Method": ['Course', 'Definition', 'Property_Theorem']},
    {"Example": ['Solution']},
    {"Solution": []},
    {"Title": ['Definition']}

  ]


};
