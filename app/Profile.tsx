import { StyleSheet, Text, View } from 'react-native';

export default function Profile() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profil</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{
    flex:1,
    backgroundColor:'#1B0E20',
    justifyContent:'center',
    alignItems:'center'
  },
  title:{
    color:'#FFFFFF',
    fontSize:28,
    fontFamily:'Poppins_700Bold'
  }
});