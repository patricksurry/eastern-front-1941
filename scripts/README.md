convert refdata/fontmap-cart.png -background black -alpha remove -sample 1600% -negate doc/fontcart.png


convert -density 300 APX_Source_Code_for_Eastern_Front_1941_rev_2.pdf[10-58] -quality 90 apxsrc%02d.jpg

for i in {10..58}; do echo $i; echo $i >> apxsrc.txt; tesseract apxsrc$i.jpg - >> apxsrc.txt; done

