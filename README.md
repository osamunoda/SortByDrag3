# SortByDrag3
FileMaker WebViewer Component for re-arranging records via Drag-and-Drop with wizard integration tool   'ComponentGenerator'.  

ComponentGenerator is the GUI tool for generating integration code of FileMaker. 

ComponentGenerator: https://github.com/osamunoda/ComponentGenerator  

This tool is available from above or it also resides in FileMaker folder in this repository.(wizard.html with bundle.js)

(requirement) FileMaker ver18~(Mac) , FileMaker Go18~

Basically the functionality is the same with older version, but there are some characteristics in this version.
I tried the followings.  
1. Minimum inervention to database scheme  
2. No contamination to global area  
3. Easy integration  

And all codes were re-written in typescript in this version.

In FileMaker folder, there are
1. SortByDrag3.fmp12 ( DEMO file )
2. tutorial.fmp12(How to integrate tutorial)
3. wizard.html( ComponentGenerator - Wizard Integration tool )
4. bundle.js( ComponentGenerator - Wizard Integration tool )

\- For those who want to tweak typescript code -  
After tweak, run the script below  

npm run fm  

This compiles all typescript files and convert those into one html file.( allinone.html in public folder )
This code includes some placeholders like this.(\_\_XXX__)  
These placeholders are replaced with FileMaker data.
Copy this code and replace the content of text object named 'SortByDrag' in your FileMaker layout.



